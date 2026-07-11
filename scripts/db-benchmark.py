import argparse
import csv
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from benchmark.db import connect_mariadb, connect_mongodb, get_mariadb_status, mongo_db
from benchmark.tests import (
    Operation,
    build_operations,
    build_precompute_operation,
    get_context,
    get_precompute_context,
    run_maria_explain,
)
from benchmark.utils import (
    diff_counters,
    now_ms,
    read_system_snapshot,
    round_number,
    summarize_numbers,
    summarize_system_io,
)

MARIADB_READ_COLUMNS = {
    "mariadbHandlerReadKey": "Handler_read_key",
    "mariadbHandlerReadRndNext": "Handler_read_rnd_next",
    "mariadbBufferPoolReadRequests": "Innodb_buffer_pool_read_requests",
    "mariadbBufferPoolReads": "Innodb_buffer_pool_reads",
    "mariadbDataReadBytes": "Innodb_data_read",
    "mariadbDataReads": "Innodb_data_reads",
    "mariadbRowsRead": "Innodb_rows_read",
}


@dataclass
class Options:
    comparison_out: Path
    concurrency: list[int]
    duration_seconds: int
    explain: bool
    only: set[str] | None
    out: Path
    repeats: int
    warmups: int


@dataclass
class WorkerState:
    conn: Any

    @classmethod
    def open(cls) -> "WorkerState":
        return cls(connect_mariadb())

    def close(self) -> None:
        self.conn.close()


def positive_int(value: str) -> int:
    number = int(value)
    if number < 1:
        raise argparse.ArgumentTypeError("must be greater than zero")
    return number


def concurrency_values(value: str) -> list[int]:
    values = [positive_int(item) for item in value.split(",") if item]
    if not values:
        raise argparse.ArgumentTypeError("must contain at least one value")
    return values


def parse_args() -> Options:
    parser = argparse.ArgumentParser(
        description="Run database performance benchmarks.",
        epilog=(
            "Quick smoke test: pnpm benchmark:db --duration=3 "
            "--warmups=1 --repeats=1 --concurrency=1"
        ),
    )
    parser.add_argument("--duration", type=positive_int, default=20)
    parser.add_argument("--warmups", type=positive_int, default=5)
    parser.add_argument("--repeats", type=positive_int, default=3)
    parser.add_argument(
        "--concurrency", type=concurrency_values, default=[1, 5, 10, 20]
    )
    parser.add_argument("--only", default="")
    parser.add_argument("--out", default="docs/db-benchmark.csv")
    parser.add_argument(
        "--comparison-out", default="docs/db-statistic-precompute.csv"
    )
    parser.add_argument("--no-explain", action="store_true")
    args = parser.parse_args()
    return Options(
        comparison_out=Path(args.comparison_out),
        concurrency=args.concurrency,
        duration_seconds=args.duration,
        explain=not args.no_explain,
        only=set(args.only.split(",")) if args.only else None,
        out=Path(args.out),
        repeats=args.repeats,
        warmups=args.warmups,
    )


def run_once(operation: Operation, context: dict[str, Any]) -> None:
    state = WorkerState.open()
    try:
        operation.run(state, context)
    finally:
        state.close()


def run_warmups(operation: Operation, context: dict[str, Any], count: int) -> None:
    state = WorkerState.open()
    try:
        for _ in range(count):
            operation.run(state, context)
    finally:
        state.close()


def worker_loop(
    operation: Operation, context: dict[str, Any], ends_at: float
) -> dict[str, Any]:
    state = WorkerState.open()
    latencies: list[float] = []
    completed = 0
    failed = 0
    errors: dict[str, int] = {}
    try:
        while now_ms() < ends_at:
            started_at = now_ms()
            try:
                operation.run(state, context)
                completed += 1
                latencies.append(now_ms() - started_at)
            except Exception as exc:
                failed += 1
                message = str(exc)
                errors[message] = errors.get(message, 0) + 1
    finally:
        state.close()
    return {
        "completed": completed,
        "errors": errors,
        "failed": failed,
        "latencies": latencies,
    }


def run_measured_window(
    operation: Operation,
    context: dict[str, Any],
    duration_seconds: int,
    concurrency: int,
) -> dict[str, Any]:
    started_at = now_ms()
    ends_at = started_at + duration_seconds * 1000
    completed = 0
    failed = 0
    errors: dict[str, int] = {}
    latencies: list[float] = []
    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [
            executor.submit(worker_loop, operation, context, ends_at)
            for _ in range(concurrency)
        ]
        for future in as_completed(futures):
            result = future.result()
            completed += result["completed"]
            failed += result["failed"]
            latencies.extend(result["latencies"])
            for message, count in result["errors"].items():
                errors[message] = errors.get(message, 0) + count

    if errors:
        print(f"  Errors: {errors}")

    elapsed_seconds = (now_ms() - started_at) / 1000
    average, stddev = summarize_numbers(latencies)
    return {
        "averageLatencyMs": average,
        "completed": completed,
        "failed": failed,
        "operationsPerSecond": round_number(completed / elapsed_seconds),
        "sampleCount": len(latencies),
        "standardDeviationMs": stddev,
        "totalLatencyMs": round_number(sum(latencies)),
    }


def benchmark_operation(
    operation: Operation,
    context: dict[str, Any],
    options: Options,
    concurrency: int,
    repeat: int,
    status_conn,
) -> dict[str, Any]:
    print(f"Running {operation.name} | concurrency={concurrency} | repeat={repeat}")
    run_warmups(operation, context, options.warmups)

    before = {
        "mariadb": get_mariadb_status(status_conn),
        "system": read_system_snapshot(),
    }

    measured = run_measured_window(
        operation, context, options.duration_seconds, concurrency
    )

    after = {
        "mariadb": get_mariadb_status(status_conn),
        "system": read_system_snapshot(),
    }

    return {
        **measured,
        "concurrency": concurrency,
        "io": summarize_system_io(
            before["system"], after["system"], options.duration_seconds
        ),
        "mariadbStatusDiff": diff_counters(before["mariadb"], after["mariadb"]),
        "operation": operation.name,
        "repeat": repeat,
    }


def benchmark_precompute(
    operation: Operation, context: dict[str, Any], options: Options
) -> dict[str, Any]:
    print(f"Running standalone {operation.name} | runs={options.repeats}")
    run_warmups(operation, context, options.warmups)
    state = WorkerState.open()
    latencies = []
    completed = 0
    failed = 0
    errors: dict[str, int] = {}
    try:
        for _ in range(options.repeats):
            started_at = now_ms()
            try:
                operation.run(state, context)
                completed += 1
                latencies.append(now_ms() - started_at)
            except Exception as exc:
                failed += 1
                message = str(exc)
                errors[message] = errors.get(message, 0) + 1
    finally:
        state.close()
    if errors:
        print(f"  Errors: {errors}")
    average, stddev = summarize_numbers(latencies)
    return {
        "operation": operation.name,
        "runs": options.repeats,
        "averageLatencyMs": average,
        "standardDeviationMs": stddev,
        "completed": completed,
        "failed": failed,
    }


def benchmark_mongodb_lookup(
    mongo, statistic_id: str, options: Options
) -> dict[str, Any]:
    name = "mongodb_lookup_precomputed_statistics_document"
    print(f"Running standalone {name} | runs={options.repeats}")
    for _ in range(options.warmups):
        mongo.statistics.find_one({"_id": statistic_id})
    latencies = []
    completed = 0
    failed = 0
    errors: dict[str, int] = {}
    for _ in range(options.repeats):
        started_at = now_ms()
        try:
            mongo.statistics.find_one({"_id": statistic_id})
            completed += 1
            latencies.append(now_ms() - started_at)
        except Exception as exc:
            failed += 1
            message = str(exc)
            errors[message] = errors.get(message, 0) + 1
    if errors:
        print(f"  Errors: {errors}")
    average, stddev = summarize_numbers(latencies)
    return {
        "operation": name,
        "runs": options.repeats,
        "averageLatencyMs": average,
        "standardDeviationMs": stddev,
        "completed": completed,
        "failed": failed,
    }


def aggregate_results(
    rows: list[dict[str, Any]], index_summary: dict[str, dict[str, Any]] | None = None
) -> list[dict[str, Any]]:
    groups: dict[tuple[str, int], list[dict[str, Any]]] = {}
    for row in rows:
        key = (row["operation"], row["concurrency"])
        groups.setdefault(key, []).append(row)

    summary = []
    for (operation, concurrency), group in groups.items():
        latency_average, latency_stddev = aggregate_latency(group)
        ops_average, ops_stddev = summarize_numbers(
            [row["operationsPerSecond"] for row in group]
        )
        summary.append(
            {
                "operation": operation,
                "concurrency": concurrency,
                **(index_summary or {}).get(operation, {}),
                "runs": len(group),
                "averageLatencyMs": latency_average,
                "standardDeviationMs": latency_stddev,
                "averageOpsPerSecond": ops_average,
                "standardDeviationOpsPerSecond": ops_stddev,
                "readMBps": average_io(group, "readMBps"),
                "writeMBps": average_io(group, "writeMBps"),
                "iowaitPercent": average_io(group, "iowaitPercent"),
                "processCpuMs": average_io(group, "processCpuMs"),
                "processRssMB": average_io(group, "processRssMB"),
                **{
                    column: average_status_counter(group, counter)
                    for column, counter in MARIADB_READ_COLUMNS.items()
                },
                "completed": sum(row["completed"] for row in group),
                "failed": sum(row["failed"] for row in group),
            }
        )
    return sorted(summary, key=lambda row: (row["operation"], row["concurrency"]))


def aggregate_latency(rows: list[dict[str, Any]]) -> tuple[float, float]:
    sample_count = sum(row["sampleCount"] for row in rows)
    if sample_count == 0:
        return 0, 0

    total_latency = sum(row["totalLatencyMs"] for row in rows)
    average = total_latency / sample_count
    square_average = (
        sum(
            row["sampleCount"]
            * (row["standardDeviationMs"] ** 2 + row["averageLatencyMs"] ** 2)
            for row in rows
        )
        / sample_count
    )
    variance = max(0, square_average - average**2)
    return round_number(average), round_number(variance**0.5)


def average_io(rows: list[dict[str, Any]], field: str) -> float:
    values = [
        row["io"][field] for row in rows if row.get("io", {}).get(field) is not None
    ]
    return summarize_numbers(values)[0]


def average_status_counter(rows: list[dict[str, Any]], counter: str) -> float:
    return summarize_numbers(
        [row["mariadbStatusDiff"].get(counter, 0) for row in rows]
    )[0]


def write_performance_summary(
    options: Options,
    results: list[dict[str, Any]],
    index_summary: dict[str, dict[str, Any]],
) -> None:
    columns = [
        "operation",
        "concurrency",
        "usesIndex",
        "scan",
        "index",
        "runs",
        "averageLatencyMs",
        "standardDeviationMs",
        "averageOpsPerSecond",
        "standardDeviationOpsPerSecond",
        "readMBps",
        "writeMBps",
        "iowaitPercent",
        "processCpuMs",
        "processRssMB",
        *MARIADB_READ_COLUMNS,
        "completed",
        "failed",
    ]
    options.out.parent.mkdir(parents=True, exist_ok=True)
    with options.out.open("w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=columns)
        writer.writeheader()
        for row in aggregate_results(results, index_summary):
            writer.writerow({column: row.get(column, "-") for column in columns})
    print(f"Wrote benchmark results to {options.out}")


def write_precompute_summary(options: Options, results: list[dict[str, Any]]) -> None:
    columns = [
        "operation",
        "runs",
        "averageLatencyMs",
        "standardDeviationMs",
        "completed",
        "failed",
    ]
    options.comparison_out.parent.mkdir(parents=True, exist_ok=True)
    with options.comparison_out.open("w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=columns)
        writer.writeheader()
        writer.writerows(results)
    print(f"Wrote standalone results to {options.comparison_out}")


def build_index_summary(
    conn, context: dict[str, Any], only: set[str] | None
) -> dict[str, dict[str, Any]]:
    rows = summarize_mariadb_explain(run_maria_explain(conn, context))
    if not only:
        return rows
    return {
        operation: summary for operation, summary in rows.items() if operation in only
    }


def summarize_mariadb_explain(
    explain: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    rows = {}
    for item in explain:
        tables = set(item.get("tables") or ["rt"])
        plan_rows = [
            row
            for row in (item.get("result") or {}).get("rows") or []
            if row.get("table") in tables
        ]
        keys = sorted({str(row["key"]) for row in plan_rows if row.get("key")})
        scan_types = sorted({str(row.get("type") or "") for row in plan_rows})
        rows[f"mariadb_{item['name']}"] = {
            "usesIndex": "yes" if keys else "no",
            "scan": ", ".join(scan_types) or "-",
            "index": ", ".join(keys) or "-",
        }
    return rows


def main() -> None:
    options = parse_args()

    conn = connect_mariadb()
    try:
        context = get_context(conn)
        operations = build_operations(context)
        if options.only:
            operations = [op for op in operations if op.name in options.only]
        if not operations:
            raise RuntimeError("No benchmark operations selected.")

        index_summary = (
            build_index_summary(conn, context, options.only) if options.explain else {}
        )

        results = []
        for operation in operations:
            run_once(operation, context)
            for concurrency in options.concurrency:
                for repeat in range(1, options.repeats + 1):
                    results.append(
                        benchmark_operation(
                            operation,
                            context,
                            options,
                            concurrency,
                            repeat,
                            conn,
                        )
                    )

        write_performance_summary(options, results, index_summary)
        client = connect_mongodb()
        try:
            mongo = mongo_db(client)
            comparison_context = get_precompute_context(mongo)
            write_precompute_summary(
                options,
                [
                    benchmark_mongodb_lookup(
                        mongo, comparison_context["statisticId"], options
                    ),
                    benchmark_precompute(
                        build_precompute_operation(comparison_context),
                        comparison_context,
                        options,
                    ),
                ],
            )
        finally:
            client.close()
    finally:
        conn.close()


if __name__ == "__main__":
    main()
