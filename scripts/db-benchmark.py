import argparse
from pathlib import Path

from benchmark.db import connect_mariadb, connect_mongodb, mongo_db
from benchmark.suite import (
    build_precompute_operation,
    build_suites,
    get_context,
    get_precompute_context,
)
from benchmark.report import (
    build_index_summary,
    write_performance_summary,
    write_precompute_summary,
)
from benchmark.runner import (
    benchmark_mongodb_lookup,
    benchmark_operation,
    benchmark_precompute,
)


def parse_args():
    parser = argparse.ArgumentParser(description="Run database performance benchmarks.")
    parser.add_argument("--warmups", type=int, default=5)
    parser.add_argument("--duration", type=int, default=10)
    parser.add_argument("--repeats", type=int, default=3)
    parser.add_argument(
        "--concurrency",
        type=lambda v: [int(x) for x in v.split(",")],
        default=[1, 5, 10, 20],
    )
    parser.add_argument("--only", default="")
    parser.add_argument("--out", type=Path, default="docs/db-benchmark.csv")
    parser.add_argument(
        "--comparison-out", type=Path, default="docs/db-statistic-precompute.csv"
    )
    args = parser.parse_args()
    args.only = set(args.only.split(",")) if args.only else None
    args.duration_seconds = args.duration
    return args


def run_benchmarks(args):
    conn = connect_mariadb()
    try:
        context = get_context(conn)
        operations = build_suites(context)
        if args.only:
            operations = [op for op in operations if op.name in args.only]

        index_summary = build_index_summary(conn, context, args.only)

        results = []
        for operation in operations:
            for concurrency in args.concurrency:
                for repeat in range(1, args.repeats + 1):
                    results.append(
                        benchmark_operation(operation, args, concurrency, repeat)
                    )

        write_performance_summary(args, results, index_summary)

        client = connect_mongodb()
        try:
            mongo = mongo_db(client)
            comparison_context = get_precompute_context(mongo)
            write_precompute_summary(
                args,
                [
                    benchmark_mongodb_lookup(
                        mongo, comparison_context["statisticId"], args
                    ),
                    benchmark_precompute(
                        build_precompute_operation(comparison_context),
                        args,
                    ),
                ],
            )
        finally:
            client.close()
    finally:
        conn.close()


if __name__ == "__main__":
    run_benchmarks(parse_args())
