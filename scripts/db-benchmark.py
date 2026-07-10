import argparse
import csv
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from benchmark.db import (
    connect_mariadb,
    connect_mongodb,
    get_mariadb_status,
    get_mongodb_counters,
    mongo_db,
)
from benchmark.tests import (
    Operation,
    build_operations,
    get_context,
    run_maria_explain,
    run_mongo_explain,
)
from benchmark.utils import (
    diff_counters,
    now_ms,
    read_system_snapshot,
    round_number,
    summarize_numbers,
    summarize_system_io,
)


@dataclass
class Options:
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
    client: Any
    mongo: Any

    @classmethod
    def open(cls) -> "WorkerState":
        conn = connect_mariadb()
        client = connect_mongodb()
        return cls(conn, client, mongo_db(client))

    def close(self) -> None:
        self.client.close()
        self.conn.close()


def parse_args() -> Options:
    parser = argparse.ArgumentParser(
        description="Run database performance benchmarks.",
        epilog=(
            "Quick smoke test: pnpm benchmark:db --duration=3 "
            "--warmups=1 --repeats=1 --concurrency=1"
        ),
    )
    parser.add_argument("--duration", type=int, default=20)
    parser.add_argument("--warmups", type=int, default=5)
    parser.add_argument("--repeats", type=int, default=3)
    parser.add_argument("--concurrency", default="1,5,10,20")
    parser.add_argument("--only", default="")
    parser.add_argument("--out", default="docs/db-benchmark.csv")
    parser.add_argument("--no-explain", action="store_true")
    args = parser.parse_args()
    return Options(
        concurrency=[int(value) for value in args.concurrency.split(",") if value],
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
    errors: dict[str, int] = {}
    completed = 0
    failed = 0
    try:
        while now_ms() < ends_at:
            started_at = now_ms()
            try:
                operation.run(state, context)
                completed += 1
            except Exception as exc:
                failed += 1
                message = str(exc)
                errors[message] = errors.get(message, 0) + 1
            latencies.append(now_ms() - started_at)
    finally:
        state.close()
    return {
        "completed": completed,
        "failed": failed,
        "latencies": latencies,
        "errors": errors,
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
    latencies: list[float] = []
    errors: dict[str, int] = {}
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

    elapsed_seconds = (now_ms() - started_at) / 1000
    average, stddev = summarize_numbers(latencies)
    return {
        "averageLatencyMs": average,
        "completed": completed,
        "errorSamples": errors,
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
    status_mongo,
) -> dict[str, Any]:
    print(f"Running {operation.name} | concurrency={concurrency} | repeat={repeat}")
    run_warmups(operation, context, options.warmups)

    before = {
        "mariadb": get_mariadb_status(status_conn),
        "mongodb": get_mongodb_counters(status_mongo),
        "system": read_system_snapshot(),
    }

    measured = run_measured_window(
        operation, context, options.duration_seconds, concurrency
    )

    after = {
        "mariadb": get_mariadb_status(status_conn),
        "mongodb": get_mongodb_counters(status_mongo),
        "system": read_system_snapshot(),
    }

    return {
        **measured,
        "concurrency": concurrency,
        "io": summarize_system_io(
            before["system"], after["system"], options.duration_seconds
        ),
        "mariadbStatusDiff": diff_counters(before["mariadb"], after["mariadb"]),
        "mongodbStatusDiff": diff_counters(before["mongodb"], after["mongodb"]),
        "operation": operation.name,
        "repeat": repeat,
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


def build_index_summary(
    conn, mongo, context: dict[str, Any], only: set[str] | None
) -> dict[str, dict[str, Any]]:
    rows = {
        **summarize_mariadb_explain(run_maria_explain(conn, context)),
        **summarize_mongodb_explain(run_mongo_explain(mongo, context)),
    }
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
        plan_rows = (item.get("result") or {}).get("rows") or []
        keys = sorted({str(row["key"]) for row in plan_rows if row.get("key")})
        scan_types = sorted({str(row.get("type") or "") for row in plan_rows})
        rows[f"mariadb_{item['name']}"] = {
            "usesIndex": "yes" if keys else "no",
            "scan": ", ".join(scan_types) or "-",
            "index": ", ".join(keys) or "-",
        }
    return rows


def summarize_mongodb_explain(
    explain: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    rows = {}
    for item in explain:
        result = item.get("result") or {}
        stages = collect_mongo_stages(result)
        indexes = sorted(
            {str(stage["indexName"]) for stage in stages if stage.get("indexName")}
        )
        stage_names = sorted(
            {
                str(stage["stage"])
                for stage in stages
                if stage.get("stage") in {"IXSCAN", "COLLSCAN"}
            }
        )
        rows[f"mongodb_{item['name']}"] = {
            "usesIndex": "yes" if "IXSCAN" in stage_names else "no",
            "scan": ", ".join(stage_names) or "-",
            "index": ", ".join(indexes) or "-",
        }
    return rows


def collect_mongo_stages(value: Any) -> list[dict[str, Any]]:
    stages = []
    if isinstance(value, dict):
        if "stage" in value:
            stages.append(value)
        for child in value.values():
            stages.extend(collect_mongo_stages(child))
    elif isinstance(value, list):
        for child in value:
            stages.extend(collect_mongo_stages(child))
    return stages


def main() -> None:
    options = parse_args()

    conn = connect_mariadb()
    client = connect_mongodb()
    mongo = mongo_db(client)
    try:
        context = get_context(conn, mongo)
        operations = build_operations(context)
        if options.only:
            operations = [op for op in operations if op.name in options.only]
        if not operations:
            raise RuntimeError("No benchmark operations selected.")

        index_summary = (
            build_index_summary(conn, mongo, context, options.only)
            if options.explain
            else {}
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
                            mongo,
                        )
                    )

        write_performance_summary(options, results, index_summary)
    finally:
        client.close()
        conn.close()


if __name__ == "__main__":
    main()
