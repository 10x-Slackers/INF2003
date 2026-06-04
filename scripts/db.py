from dataclasses import dataclass
from pathlib import Path
from typing import Any
import os
import re

import MySQLdb

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


class Database:
    def __init__(self, config: DatabaseConfig | None = None):
        self.config = config or self._load_config()

    def connect(self):
        return MySQLdb.connect(
            host=self.config.host,
            port=self.config.port,
            user=self.config.user,
            passwd=self.config.password,
            charset="utf8mb4",
        )

    def use_database(self, cursor) -> None:
        self._validate_identifier(self.config.database)
        cursor.execute(f"USE `{self.config.database}`")

    def apply_schema(self) -> int:
        """
        Applies the SQL schema from the configured schema file to the database.

        Returns:
            int: The number of SQL statements executed.
        """
        if not self.config.schema_path.exists():
            raise FileNotFoundError(f"Schema file not found: {self.config.schema_path}")

        schema_sql = self.config.schema_path.read_text(encoding="utf-8")
        statements = self._split_sql_statements(schema_sql)

        if not statements:
            raise ValueError(f"Schema file is empty: {self.config.schema_path}")

        connection = self.connect()

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    f"CREATE DATABASE IF NOT EXISTS `{self.config.database}` "
                    "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                )
                self.use_database(cursor)

                for statement in statements:
                    cursor.execute(statement)

            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

        return len(statements)

    def teardown(self) -> None:
        """
        Drops the configured database, deleting all tables and data.
        """
        connection = self.connect()

        try:
            with connection.cursor() as cursor:
                self._validate_identifier(self.config.database)
                cursor.execute(f"DROP DATABASE IF EXISTS `{self.config.database}`")

            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def insert_rows(self, cursor, table: str, rows: list[dict[str, Any]]) -> int:
        """
        Inserts multiple rows into the specified table.

        Args:
            cursor: The database cursor.
            table (str): The name of the table to insert into.
            rows (list[dict[str, Any]]): A list of dictionaries representing the rows to insert.

        Returns:
            int: The ID of the last inserted row.
        """
        if not rows:
            return 0

        self._validate_row_identifiers(table, rows[0])
        columns = tuple(rows[0].keys())
        placeholders = ", ".join(["%s"] * len(columns))
        column_names = ", ".join(columns)
        sql = f"INSERT INTO {table} ({column_names}) VALUES ({placeholders})"

        values = [tuple(row[column] for column in columns) for row in rows]
        cursor.executemany(sql, values)
        return cursor.lastrowid

    def upsert_row(
        self,
        cursor,
        table: str,
        row: dict[str, Any],
        unique_column: str,
        update_columns: list[str] | None = None,
    ) -> int:
        """
        Inserts a row into the specified table or updates it if a row with the same unique column value already exists.
        """
        self._validate_row_identifiers(table, row)
        self._validate_identifier(unique_column)

        if unique_column not in row:
            raise ValueError(f"Unique column {unique_column} is missing from row")

        columns = tuple(row.keys())
        placeholders = ", ".join(["%s"] * len(columns))
        column_names = ", ".join(columns)
        values = tuple(row[column] for column in columns)

        if update_columns is None:
            update_columns = [column for column in columns if column != unique_column]

        for column in update_columns:
            self._validate_identifier(column)
            if column not in row:
                raise ValueError(f"Update column {column} is missing from row")

        if update_columns:
            update_clause = ", ".join(
                f"{column} = VALUES({column})" for column in update_columns
            )
        else:
            update_clause = f"{unique_column} = VALUES({unique_column})"

        cursor.execute(
            f"""
            INSERT INTO {table} ({column_names})
            VALUES ({placeholders})
            ON DUPLICATE KEY UPDATE {update_clause}
            """,
            values,
        )
        cursor.execute(
            f"SELECT id FROM {table} WHERE {unique_column} = %s",
            (row[unique_column],),
        )
        result = cursor.fetchone()

        if result is None:
            raise ValueError(f"Could not find inserted row in {table}")

        return result[0]

    def _validate_row_identifiers(self, table: str, row: dict[str, Any]) -> None:
        """
        validates that the table name and column names in the row are safe SQL identifiers.

        Args:
            table (str): The name of the table.
            row (dict[str, Any]): The row data to validate.
        """
        self._validate_identifier(table)

        if not row:
            raise ValueError("Cannot insert an empty row")

        for column in row:
            self._validate_identifier(column)

    def _load_config(self) -> DatabaseConfig:
        """
        Loads the database configuration from environment variables, using defaults if not set.
        """
        port_value = os.getenv("DB_PORT", str(DEFAULT_PORT))

        try:
            port = int(port_value)
        except ValueError as exc:
            raise ValueError("DB_PORT must be an integer") from exc

        database = os.getenv("DB_NAME", DEFAULT_DATABASE)
        self._validate_identifier(database)

        return DatabaseConfig(
            host=os.getenv("DB_HOST", DEFAULT_HOST),
            port=port,
            user=os.getenv("DB_USER", DEFAULT_USER),
            password=os.getenv("DB_PASSWORD", DEFAULT_PASSWORD),
            database=database,
            schema_path=Path(os.getenv("SCHEMA_PATH", str(DEFAULT_SCHEMA_PATH))),
        )

    def _validate_identifier(self, identifier: str) -> None:
        """
        Validates that the given identifier is a safe SQL identifier.
        """
        if not SAFE_IDENTIFIER.fullmatch(identifier):
            raise ValueError(
                "SQL identifiers must start with a letter or underscore and contain only "
                "letters, numbers, and underscores"
            )

    def _split_sql_statements(self, sql: str) -> list[str]:
        """
        Splits a string containing multiple SQL statements into a list of individual statements.

        Args:
            sql (str): The string containing the SQL statements.
        Returns:
            list[str]: A list of individual SQL statements.
        """
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
