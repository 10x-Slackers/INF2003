import csv
from typing import Any

from .measure import round_number, summarize_numbers
from .suite import run_maria_explain


def write_performance_summary(options, results, index_summary):
    columns = [
        "operation",
        "concurrency",
        "usesIndex",
        "scan",
        "index",
        "mariadbHandlerReadRndNext",
        "runs",
        "averageLatencyMs",
        "standardDeviationMs",
        "averageOpsPerSecond",
        "standardDeviationOpsPerSecond",
    ]
    options.out.parent.mkdir(parents=True, exist_ok=True)
    with options.out.open("w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=columns)
        writer.writeheader()
        for row in aggregate_results(results, index_summary):
            writer.writerow({c: row.get(c, "-") for c in columns})
    print(f"Wrote benchmark results to {options.out}")


def write_precompute_summary(options, results):
    columns = ["operation", "runs", "averageLatencyMs", "standardDeviationMs"]
    options.comparison_out.parent.mkdir(parents=True, exist_ok=True)
    with options.comparison_out.open("w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=columns)
        writer.writeheader()
        writer.writerows(results)
    print(f"Wrote standalone results to {options.comparison_out}")


def build_index_summary(conn, context, only):
    rows = summarize_mariadb_explain(run_maria_explain(conn, context))
    if not only:
        return rows
    return {op: s for op, s in rows.items() if op in only}


def aggregate_results(rows, index_summary=None):
    """Group rows by (operation, concurrency) and average across repeats."""
    groups: dict[tuple[str, int], list[dict[str, Any]]] = {}
    for row in rows:
        groups.setdefault((row["operation"], row["concurrency"]), []).append(row)

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
                "mariadbHandlerReadRndNext": average_handler_read_rnd_next(group),
                "averageLatencyMs": latency_average,
                "standardDeviationMs": latency_stddev,
                "averageOpsPerSecond": ops_average,
                "standardDeviationOpsPerSecond": ops_stddev,
            }
        )
    return sorted(summary, key=lambda row: (row["operation"], row["concurrency"]))


def average_handler_read_rnd_next(rows):
    completed = sum(row["sampleCount"] for row in rows)
    if completed == 0:
        return 0
    return round_number(
        sum(row["handlerReadRndNextTotal"] for row in rows) / completed
    )


def aggregate_latency(rows):
    """Pool per-window latency stats into a mean and stddev."""
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


def summarize_mariadb_explain(explain):
    rows = {}
    for item in explain:
        tables = set(item["tables"])
        plan_rows = [r for r in item["rows"] if r.get("table") in tables]
        keys = sorted({r["key"] for r in plan_rows if r.get("key")})
        scan_types = sorted({r.get("type", "") for r in plan_rows})
        rows[f"mariadb_{item['name']}"] = {
            "usesIndex": "yes" if keys else "no",
            "scan": ", ".join(scan_types) or "-",
            "index": ", ".join(keys) or "-",
        }
    return rows
