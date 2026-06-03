from __future__ import annotations

import argparse
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path


DEFAULT_HOST = "mariadb"
DEFAULT_PORT = 3306
DEFAULT_USER = "root"
DEFAULT_PASSWORD = "P@ssw0rd"
DEFAULT_DATABASE = "inf2003"
DEFAULT_SCHEMA_PATH = Path("sql/schema.sql")

SAFE_IDENTIFIER = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


@dataclass(frozen=True)
class DatabaseConfig:
    host: str
    port: int
    user: str
    password: str
    database: str
    schema_path: Path


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


def load_config() -> DatabaseConfig:
    port_value = os.getenv("DB_PORT", str(DEFAULT_PORT))

    try:
        port = int(port_value)
    except ValueError as exc:
        raise ValueError("DB_PORT must be an integer") from exc

    database = os.getenv("DB_NAME", DEFAULT_DATABASE)
    if not SAFE_IDENTIFIER.fullmatch(database):
        raise ValueError(
            "DB_NAME must start with a letter or underscore and contain only "
            "letters, numbers, and underscores"
        )

    return DatabaseConfig(
        host=os.getenv("DB_HOST", DEFAULT_HOST),
        port=port,
        user=os.getenv("DB_USER", DEFAULT_USER),
        password=os.getenv("DB_PASSWORD", DEFAULT_PASSWORD),
        database=database,
        schema_path=Path(os.getenv("SCHEMA_PATH", str(DEFAULT_SCHEMA_PATH))),
    )


def split_sql_statements(sql: str) -> list[str]:
    statements: list[str] = []
    current: list[str] = []
    quote: str | None = None
    escaped = False

    for char in sql:
        current.append(char)

        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            continue

        if char in {"'", '"', "`"}:
            quote = char
            continue

        if char == ";":
            statement = "".join(current).strip()
            if statement:
                statements.append(statement)
            current = []

    trailing_statement = "".join(current).strip()
    if trailing_statement:
        statements.append(trailing_statement)

    return statements


def connect(config: DatabaseConfig):
    import MySQLdb

    return MySQLdb.connect(
        host=config.host,
        port=config.port,
        user=config.user,
        passwd=config.password,
        charset="utf8mb4",
    )


def apply_schema(config: DatabaseConfig) -> int:
    if not config.schema_path.exists():
        raise FileNotFoundError(f"Schema file not found: {config.schema_path}")

    schema_sql = config.schema_path.read_text(encoding="utf-8")
    statements = split_sql_statements(schema_sql)

    if not statements:
        raise ValueError(f"Schema file is empty: {config.schema_path}")

    connection = connect(config)

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{config.database}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
            cursor.execute(f"USE `{config.database}`")

            for statement in statements:
                cursor.execute(statement)

        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()

    return len(statements)


def teardown_database(config: DatabaseConfig) -> None:
    connection = connect(config)

    try:
        with connection.cursor() as cursor:
            cursor.execute(f"DROP DATABASE IF EXISTS `{config.database}`")

        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def main() -> int:
    args = parse_args()

    try:
        config = load_config()

        if args.teardown:
            teardown_database(config)
            print(f"Dropped database {config.database} on {config.host}:{config.port}.")
            return 0

        statement_count = apply_schema(config)
    except Exception as exc:
        print(f"Database operation failed: {exc}", file=sys.stderr)
        return 1

    print(
        f"Applied {statement_count} schema statements to "
        f"{config.database} on {config.host}:{config.port}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
