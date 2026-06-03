import argparse
import os
from pathlib import Path

import mariadb


ROOT_DIR = Path(__file__).resolve().parents[1]
DATASETS_DIR = ROOT_DIR / "datasets"
SCHEMA_PATH = ROOT_DIR / "sql" / "schema.sql"
TEARDOWN_PATH = ROOT_DIR / "sql" / "teardown.sql"

TOWNS_CSV = DATASETS_DIR / "towns_flattened_data.csv"
RESALE_CSV = (
    DATASETS_DIR / "ResaleflatpricesbasedonregistrationdatefromJan2017onwards.csv"
)
SCHOOLS_CSV = DATASETS_DIR / "Generalinformationofschools.csv"
PARKS_CSV = DATASETS_DIR / "parks_clean.csv"
GYMS_CSV = DATASETS_DIR / "gyms_clean.csv"

BATCH_SIZE = 1000


class Database:
    def __init__(self, user, password, host, port, database):
        self.user = user
        self.password = password
        self.host = host
        self.port = port
        self.database = database
        self.conn = None
        self.cursor = None

    def connect(self):
        try:
            self.conn = mariadb.connect(
                user=self.user,
                password=self.password,
                host=self.host,
                port=self.port,
                autocommit=False,
            )
            self.cursor = self.conn.cursor()
            self.cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{self.database}`")
            self.cursor.execute(f"USE `{self.database}`")
            print(f"Connected to MariaDB database `{self.database}`.")
        except mariadb.Error as e:
            raise RuntimeError(f"Error connecting to MariaDB: {e}") from e

    def close(self):
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()


def execute_schema(cursor):
    with open(SCHEMA_PATH, "r") as f:
        schema_sql = f.read()
    statements = schema_sql.split(";")
    for stmt in statements:
        stmt = stmt.strip()
        if stmt:
            cursor.execute(stmt)


def reset_tables(cursor):
    with open(TEARDOWN_PATH, "r") as f:
        teardown_sql = f.read()
    statements = teardown_sql.split(";")
    for stmt in statements:
        stmt = stmt.strip()
        if stmt:
            cursor.execute(stmt)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Create and seed the INF2003 MariaDB database."
    )
    parser.add_argument(
        "--teardown",
        action="store_true",
        help="Drop all tables before loading data.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    db = Database(
        os.getenv("DB_USER", "root"),
        os.getenv("DB_PASSWORD", "P@ssw0rd"),
        os.getenv("DB_HOST", "mariadb"),
        int(os.getenv("DB_PORT", "3306")),
        os.getenv("DB_NAME", "inf2003"),
    )

    try:
        db.connect()
        if args.teardown:
            reset_tables(db.cursor)
        else:
            execute_schema(db.cursor)
    except Exception:
        if db.conn:
            db.conn.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
