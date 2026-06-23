from typing import Any

import pandas as pd

from transform import TransformResult


def load_mariadb(result: TransformResult, db: Any) -> dict[str, dict[str, str]]:
    """Load TransformResult.mariadb frames into MariaDB and return id_maps for MongoDB."""
    frames = result.mariadb
    cursor = db.cursor()

    # Parent tables (small lookup tables, row-by-row to capture IDs)
    town_ids = insert_dataframe_with_id(cursor, "towns", frames["towns"])
    amenity_type_ids = insert_dataframe_with_id(
        cursor, "amenity_types", frames["amenity_types"]
    )
    flat_type_ids = insert_dataframe_with_id(cursor, "flat_types", frames["flat_types"])
    flat_model_ids = insert_dataframe_with_id(
        cursor, "flat_models", frames["flat_models"]
    )
    storey_range_ids = insert_dataframe_with_id(
        cursor, "storey_ranges", frames["storey_ranges"]
    )

    # Properties (remap town_key -> town_id, then insert row-by-row)
    properties = _replace_key(frames["properties"], "town_key", "town_id", town_ids)
    property_ids = insert_dataframe_with_id(cursor, "properties", properties)

    # Child tables (bulk insert via executemany)
    amenities = _replace_key(
        _replace_key(
            frames["amenities"],
            "town_key",
            "town_id",
            town_ids,
        ),
        "amenity_type_key",
        "amenity_type_id",
        amenity_type_ids,
    )
    insert_dataframe(cursor, "amenities", amenities)

    transactions = frames["resale_transactions"].copy()
    for src, tgt, key in [
        ("property_key", "property_id", property_ids),
        ("flat_type_key", "flat_type_id", flat_type_ids),
        ("flat_model_key", "flat_model_id", flat_model_ids),
        ("storey_range_key", "storey_range_id", storey_range_ids),
    ]:
        transactions = _replace_key(transactions, src, tgt, key)
    # Drop town_key as it is only used for MongoDB document building
    transactions = transactions.drop(columns=["town_key"], errors="ignore")
    insert_dataframe(cursor, "resale_transactions", transactions)

    db.commit()

    return {
        "town_ids": town_ids,
        "amenity_type_ids": amenity_type_ids,
        "flat_type_ids": flat_type_ids,
        "flat_model_ids": flat_model_ids,
        "storey_range_ids": storey_range_ids,
        "property_ids": property_ids,
    }


def insert_dataframe(cursor: Any, table_name: str, df: pd.DataFrame) -> None:
    """Bulk-insert a dataframe via executemany."""
    if df.empty:
        return

    columns = _insert_columns(df)
    sql = _insert_sql(table_name, columns)
    rows = _rows(df, columns)
    cursor.executemany(sql, rows)


def insert_dataframe_with_id(
    cursor: Any,
    table_name: str,
    df: pd.DataFrame,
) -> dict[str, str]:
    """Insert a dataframe row-by-row and return a source-id -> db-id map."""
    if "id" not in df.columns:
        raise ValueError("DataFrame must include an 'id' column")

    if df.empty:
        return {}

    columns = _insert_columns(df)
    sql = _insert_sql(table_name, columns, return_id=True)
    data = _clean_dataframe(_sort_by_source_id(df).reset_index(drop=True))
    id_map: dict[str, str] = {}

    for record in data.to_dict(orient="records"):
        source_id = str(record.pop("id"))
        row = tuple(record[column] for column in columns)
        cursor.execute(sql, row)
        result = cursor.fetchone()
        if result is None:
            raise RuntimeError(f"No ID returned when inserting into {table_name}")
        id_map[source_id] = str(result[0])

    return id_map


def _get_mariadb_id(source_key: Any, id_map: dict[str, str], key_name: str) -> str:
    """Look up a MariaDB surrogate ID for source_key."""
    mariadb_id = id_map.get(str(source_key))
    if mariadb_id is None:
        raise ValueError(f"No MariaDB ID for {key_name}: {source_key}")
    return mariadb_id


def _get_optional_mariadb_id(
    source_key: Any, id_map: dict[str, str], key_name: str
) -> str | None:
    """Look up a MariaDB surrogate ID, returning None for NaN/ALL values."""
    if source_key is None or pd.isna(source_key):
        return None
    return _get_mariadb_id(source_key, id_map, key_name)


def _replace_key(
    dataframe: pd.DataFrame,
    source_column: str,
    target_column: str,
    id_map: dict[str, str],
) -> pd.DataFrame:
    """Replace a natural-key column with its surrogate DB IDs."""
    if source_column not in dataframe.columns:
        raise ValueError(f"Missing source key column '{source_column}'")

    result = dataframe.copy()
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


def _insert_columns(df: pd.DataFrame) -> list[str]:
    """Return column names for INSERT, excluding the id column."""
    columns = df.columns.drop("id", errors="ignore").tolist()
    if not columns:
        raise ValueError("DataFrame must include at least one insert column")
    return columns


def _insert_sql(table_name: str, columns: list[str], return_id: bool = False) -> str:
    """Build an INSERT SQL statement with optional RETURNING clause."""
    column_names = ", ".join(_quote_identifier(c) for c in columns)
    placeholders = ", ".join(["%s"] * len(columns))
    table_identifier = _quote_identifier(table_name)
    return_id_stmt = f" RETURNING {_quote_identifier('id')}" if return_id else ""
    return (
        f"INSERT INTO {table_identifier} ({column_names}) "
        f"VALUES ({placeholders}){return_id_stmt}"
    )


def _quote_identifier(identifier: str) -> str:
    """Backtick-quote a MariaDB identifier, escaping embedded backticks."""
    return f"`{identifier.replace('`', '``')}`"


def _clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Replace NaN with None for safe MySQL parameter binding."""
    return df.astype(object).where(pd.notna(df), None)


def _sort_by_source_id(df: pd.DataFrame) -> pd.DataFrame:
    """Sort by the id column (numeric sort if possible)."""
    numeric_ids = pd.to_numeric(df["id"], errors="coerce")
    if numeric_ids.notna().all():
        return (
            df.assign(_source_id_sort=numeric_ids)
            .sort_values("_source_id_sort")
            .drop(columns="_source_id_sort")
        )
    return df.sort_values("id")


def _rows(df: pd.DataFrame, columns: list[str]) -> list[tuple[object, ...]]:
    """Convert a DataFrame slice to a list of row tuples for executemany."""
    clean_df = _clean_dataframe(df.loc[:, columns])
    return list(clean_df.itertuples(index=False, name=None))
