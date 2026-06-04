from __future__ import annotations

import argparse
import sys

from scripts.db import Database
from scripts.seed import seed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Initialize or teardown the INF2003 MariaDB/MySQL database."
    )
    parser.add_argument(
        "--teardown",
        action="store_true",
        help="Drop the configured database and exit. This deletes all tables and data.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        db = Database()

        if args.teardown:
            db.teardown()
            print(
                f"Dropped database {db.config.database} "
                f"on {db.config.host}:{db.config.port}."
            )
            return 0

        statement_count = db.apply_schema()
    except Exception as exc:
        print(f"Database operation failed: {exc}", file=sys.stderr)
        return 1

    print(
        f"Applied {statement_count} schema statements to "
        f"{db.config.database} on {db.config.host}:{db.config.port}."
    )

    try:
        return seed()
    except Exception as exc:
        print(f"Seed operation failed: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
