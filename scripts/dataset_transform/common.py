from datetime import UTC, datetime
import ast
import re
from typing import Any

import pandas as pd
from shapely.geometry import shape
from shapely.geometry.base import BaseGeometry


def get_value(row: pd.Series, column: str) -> Any:
    value = row.get(column)
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    return value


def clean_text(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value).strip())


def key(value: Any) -> str:
    return clean_text(value).upper()


def dedupe_sort(frame: pd.DataFrame, sort_columns: list[str]) -> pd.DataFrame:
    return frame.drop_duplicates().sort_values(sort_columns).reset_index(drop=True)


def geometry_from_row(row: pd.Series) -> BaseGeometry:
    geometry_type = get_value(row, "geometry.type")
    coordinates = as_list(get_value(row, "geometry.coordinates"))
    if not geometry_type or coordinates is None:
        raise ValueError("GeoJSON row is missing geometry.type or geometry.coordinates")
    return shape({"type": geometry_type, "coordinates": coordinates})


def as_list(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    if isinstance(value, tuple):
        return list(value)
    if isinstance(value, str):
        parsed = ast.literal_eval(value)
        if isinstance(parsed, tuple):
            return list(parsed)
        if isinstance(parsed, list):
            return parsed
    raise ValueError(f"Expected list-like coordinates, got: {value!r}")


def iso_timestamp(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")
