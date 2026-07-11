from concurrent.futures import ThreadPoolExecutor, as_completed

from .db import connect_mariadb
from .measure import now_ms, round_number, summarize_numbers


def worker_loop(operation, ends_at):
    conn = connect_mariadb()
    latencies = []
    completed = 0
    try:
        while now_ms() < ends_at:
            started_at = now_ms()
            operation.run(conn)
            completed += 1
            latencies.append(now_ms() - started_at)
    finally:
        conn.close()
    return completed, latencies


def run_measured_window(operation, duration_seconds, concurrency):
    started_at = now_ms()
    ends_at = started_at + duration_seconds * 1000
    completed = 0
    latencies = []
    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [
            executor.submit(worker_loop, operation, ends_at) for _ in range(concurrency)
        ]
        for future in as_completed(futures):
            count, lats = future.result()
            completed += count
            latencies.extend(lats)

    elapsed_seconds = (now_ms() - started_at) / 1000
    average, stddev = summarize_numbers(latencies)
    return {
        "averageLatencyMs": average,
        "operationsPerSecond": round_number(completed / elapsed_seconds),
        "sampleCount": len(latencies),
        "standardDeviationMs": stddev,
        "totalLatencyMs": round_number(sum(latencies)),
    }


def benchmark_operation(operation, options, concurrency, repeat):
    print(f"Running {operation.name} | concurrency={concurrency} | repeat={repeat}")

    conn = connect_mariadb()
    try:
        for _ in range(options.warmups):
            operation.run(conn)
    finally:
        conn.close()

    measured = run_measured_window(operation, options.duration_seconds, concurrency)
    return {
        **measured,
        "concurrency": concurrency,
        "operation": operation.name,
        "repeat": repeat,
    }


def run_sequential(name, run, runs, warmups):
    print(f"Running standalone {name} | runs={runs}")
    for _ in range(warmups):
        run()

    latencies = []
    for _ in range(runs):
        started_at = now_ms()
        run()
        latencies.append(now_ms() - started_at)
    average, stddev = summarize_numbers(latencies)
    return {
        "operation": name,
        "runs": runs,
        "averageLatencyMs": average,
        "standardDeviationMs": stddev,
    }


def benchmark_precompute(operation, options):
    conn = connect_mariadb()
    try:
        return run_sequential(
            operation.name,
            lambda: operation.run(conn),
            options.repeats,
            options.warmups,
        )
    finally:
        conn.close()


def benchmark_mongodb_lookup(mongo, statistic_id, options):
    return run_sequential(
        "mongodb_lookup_precomputed_statistics_document",
        lambda: mongo.statistics.find_one({"_id": statistic_id}),
        options.repeats,
        options.warmups,
    )
