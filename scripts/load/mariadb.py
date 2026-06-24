from typing import Any

import pandas as pd

from transform import TransformResult


class MariaDBLoader:
    """Loads TransformResult.sql frames into MariaDB."""

    def __init__(self, db: Any) -> None:
        self.db = db
        self.cursor = db.cursor()
        self.id_maps: dict[str, dict[str, str]] = {}

    def close(self) -> None:
        """Close the cursor to release database resources promptly."""
        self.cursor.close()

    def __enter__(self) -> "MariaDBLoader":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()

    def load(self, result: TransformResult) -> dict[str, dict[str, str]]:
        """Load all frames and return id_maps."""
        frames = result.sql

        self._load_parent_tables(frames)
        self._load_properties(frames)
        self._load_child_tables(frames)

        self.db.commit()
        return self.id_maps

    def _load_parent_tables(self, frames: dict[str, pd.DataFrame]) -> None:
        """Load parent tables first to generate surrogate IDs for child tables."""
        self.id_maps["town_ids"] = self._insert_with_id("towns", frames["towns"])
        self.id_maps["amenity_type_ids"] = self._insert_with_id(
            "amenity_types", frames["amenity_types"]
        )
        self.id_maps["flat_type_ids"] = self._insert_with_id(
            "flat_types", frames["flat_types"]
        )
        self.id_maps["flat_model_ids"] = self._insert_with_id(
            "flat_models", frames["flat_models"]
        )
        self.id_maps["storey_range_ids"] = self._insert_with_id(
            "storey_ranges", frames["storey_ranges"]
        )

    def _load_properties(self, frames: dict[str, pd.DataFrame]) -> None:
        """Load properties table and generate surrogate IDs for transactions."""
        properties = self._replace_key(
            frames["properties"], "town_key", "town_id", self.id_maps["town_ids"]
        )
        self.id_maps["property_ids"] = self._insert_with_id("properties", properties)

    def _load_child_tables(self, frames: dict[str, pd.DataFrame]) -> None:
        """Remap foreign keys and load child tables."""
        amenities = self._replace_key(
            self._replace_key(
                frames["amenities"], "town_key", "town_id", self.id_maps["town_ids"]
            ),
            "amenity_type_key",
            "amenity_type_id",
            self.id_maps["amenity_type_ids"],
        )
        self._insert("amenities", amenities)

        transactions = frames["resale_transactions"].copy()
        for src, tgt, id_map_key in [
            ("property_key", "property_id", "property_ids"),
            ("flat_type_key", "flat_type_id", "flat_type_ids"),
            ("flat_model_key", "flat_model_id", "flat_model_ids"),
            ("storey_range_key", "storey_range_id", "storey_range_ids"),
        ]:
            transactions = self._replace_key(
                transactions, src, tgt, self.id_maps[id_map_key]
            )
        transactions = transactions.drop(columns=["town_key"], errors="ignore")
        self._insert("resale_transactions", transactions)

    def _insert(self, table_name: str, df: pd.DataFrame) -> None:
        """Bulk-insert a dataframe via executemany."""
        if df.empty:
            return
        columns = self._insert_columns(df)
        sql = self._insert_sql(table_name, columns)
        self.cursor.executemany(sql, self._rows(df, columns))

    def _insert_with_id(self, table_name: str, df: pd.DataFrame) -> dict[str, str]:
        """Insert row-by-row and return a source-id -> db-id map."""
        if "id" not in df.columns:
            raise ValueError("DataFrame must include an 'id' column")
        if df.empty:
            return {}

        columns = self._insert_columns(df)
        sql = self._insert_sql(table_name, columns, return_id=True)
        data = self._clean_dataframe(df.sort_values("id").reset_index(drop=True))

        id_map: dict[str, str] = {}
        for record in data.to_dict(orient="records"):
            source_id = str(record.pop("id"))
            row = tuple(record[column] for column in columns)
            self.cursor.execute(sql, row)
            result = self.cursor.fetchone()
            if result is None:
                raise RuntimeError(f"No ID returned when inserting into {table_name}")
            id_map[source_id] = str(result[0])
        return id_map

    @staticmethod
    def _insert_columns(df: pd.DataFrame) -> list[str]:
        """Return column names for INSERT, excluding the id column."""
        columns = df.columns.drop("id", errors="ignore").tolist()
        if not columns:
            raise ValueError("DataFrame must include at least one insert column")
        return columns

    @staticmethod
    def _insert_sql(
        table_name: str, columns: list[str], return_id: bool = False
    ) -> str:
        """Build an INSERT SQL statement with optional RETURNING clause."""
        column_names = ", ".join(MariaDBLoader._quote_identifier(c) for c in columns)
        placeholders = ", ".join(["%s"] * len(columns))
        table_identifier = MariaDBLoader._quote_identifier(table_name)
        return_id_stmt = (
            f" RETURNING {MariaDBLoader._quote_identifier('id')}" if return_id else ""
        )
        return (
            f"INSERT INTO {table_identifier} ({column_names}) "
            f"VALUES ({placeholders}){return_id_stmt}"
        )

    @staticmethod
    def _quote_identifier(identifier: str) -> str:
        """Backtick-quote a MariaDB identifier, escaping embedded backticks."""
        return f"`{identifier.replace('`', '``')}`"

    @staticmethod
    def _clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
        """Replace NaN with None for safe MySQL parameter binding."""
        return df.astype(object).where(pd.notna(df), None)

    @staticmethod
    def _rows(df: pd.DataFrame, columns: list[str]) -> list[tuple[object, ...]]:
        """Convert a DataFrame slice to a list of row tuples for executemany."""
        clean_df = MariaDBLoader._clean_dataframe(df.loc[:, columns])
        return list(clean_df.itertuples(index=False, name=None))

    def _replace_key(
        self,
        df: pd.DataFrame,
        source_column: str,
        target_column: str,
        id_map: dict[str, str],
    ) -> pd.DataFrame:
        """Replace a natural-key column with its surrogate DB IDs."""
        if source_column not in df.columns:
            raise ValueError(f"Missing source key column '{source_column}'")

        result = df.copy()
        result[target_column] = result[source_column].astype(str).map(id_map)
        missing = sorted(
            result.loc[result[target_column].isna(), source_column]
            .astype(str)
            .unique()
            .tolist()
        )
        if missing:
            raise ValueError(
                f"Unresolved foreign keys for '{source_column}': " + ", ".join(missing)
            )
        return result.drop(columns=source_column)
