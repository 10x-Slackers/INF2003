import os

import MySQLdb
import pandas as pd

from scripts.db.mariadb_schema import init_tables, teardown_tables


class Database:
    def __init__(self, host: str, user: str, password: str, database: str) -> None:
        self.connection = MySQLdb.connect(
            host=host, user=user, password=password, database=database
        )
        self.cursor = self.connection.cursor()

    def __enter__(self) -> "Database":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        if exc_type is not None:
            self.rollback()
        self.close()

    def insert_dataframe(self, table_name: str, df: pd.DataFrame) -> None:
        """
        Inserts a DataFrame into the specified table in the database.
        """
        if df.empty:
            return None

        columns = self._insert_columns(df)
        sql = self._insert_sql(table_name, columns)
        rows = self._rows(df, columns)

        self.cursor.executemany(sql, rows)
        self.commit()
        return None

    def insert_dataframe_with_id(
        self, table_name: str, df: pd.DataFrame
    ) -> dict[str, str]:
        """
        Inserts a DataFrame and returns a map of source IDs to generated database IDs.

        This inserts row by row so each generated ID can be captured. Use it for
        small lookup tables, not large fact tables such as resale transactions.
        """
        if "id" not in df.columns:
            raise ValueError("DataFrame must include an 'id' column")

        if df.empty:
            return {}

        columns = self._insert_columns(df)
        sql = self._insert_sql(table_name, columns, return_id=True)
        data = self._clean_dataframe(self._sort_by_source_id(df).reset_index(drop=True))
        id_map = {}
        for record in data.to_dict(orient="records"):
            source_id = str(record.pop("id"))
            row = tuple(record[column] for column in columns)
            self.cursor.execute(sql, row)
            result = self.cursor.fetchone()
            if result is None:
                raise RuntimeError(f"No ID returned when inserting into {table_name}")
            id_map[source_id] = str(result[0])

        self.commit()
        return id_map

    def rollback(self) -> None:
        self.connection.rollback()

    def close(self) -> None:
        self.cursor.close()
        self.connection.close()

    def create_tables(self) -> None:
        init_tables(self.cursor)
        self.commit()

    def reset_tables(self) -> None:
        teardown_tables(self.cursor)
        init_tables(self.cursor)
        self.commit()

    def commit(self) -> None:
        self.connection.commit()

    @classmethod
    def _insert_columns(cls, df: pd.DataFrame) -> list[str]:
        columns = df.columns.drop("id", errors="ignore").tolist()
        if not columns:
            raise ValueError("DataFrame must include at least one insert column")
        return columns

    @classmethod
    def _insert_sql(
        cls, table_name: str, columns: list[str], return_id: bool = False
    ) -> str:
        column_names = ", ".join(cls._quote_identifier(column) for column in columns)
        placeholders = ", ".join(["%s"] * len(columns))
        table_identifier = cls._quote_identifier(table_name)
        return_id_stmt = (
            f" RETURNING {cls._quote_identifier('id')}" if return_id else ""
        )
        return (
            f"INSERT INTO {table_identifier} ({column_names}) "
            f"VALUES ({placeholders}){return_id_stmt}"
        )

    @staticmethod
    def _quote_identifier(identifier: str) -> str:
        return f"`{identifier.replace('`', '``')}`"

    @staticmethod
    def _clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
        return df.astype(object).where(pd.notna(df), None)

    @staticmethod
    def _sort_by_source_id(df: pd.DataFrame) -> pd.DataFrame:
        numeric_ids = pd.to_numeric(df["id"], errors="coerce")
        if numeric_ids.notna().all():
            return (
                df.assign(_source_id_sort=numeric_ids)
                .sort_values("_source_id_sort")
                .drop(columns="_source_id_sort")
            )

        return df.sort_values("id")

    @classmethod
    def _rows(cls, df: pd.DataFrame, columns: list[str]) -> list[tuple[object, ...]]:
        clean_df = cls._clean_dataframe(df.loc[:, columns])
        return list(clean_df.itertuples(index=False, name=None))


def main():
    db = Database(
        host=os.environ.get("DB_HOST", "mariadb"),
        user=os.environ.get("DB_USER", "root"),
        password=os.environ.get("DB_PASSWORD", "P@ssw0rd"),
        database=os.environ.get("DB_NAME", "inf2003"),
    )
    try:
        db.reset_tables()
    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
