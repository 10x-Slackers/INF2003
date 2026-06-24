import ast
import re
from typing import Any

import pandas as pd
from shapely.geometry import shape
from shapely.geometry.base import BaseGeometry


def get_value(row: pd.Series, column: str) -> Any:
    """Safely extract a value from a row Series, returning None for missing/NaN."""
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
    """Normalise whitespace and strip; returns empty string for None."""
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value).strip())


def key(value: Any) -> str:
    """Uppercase-and-clean version of clean_text, used for natural keys."""
    return clean_text(value).upper()


def geometry_from_row(row: pd.Series) -> BaseGeometry:
    """Build a Shapely geometry from a GeoJSON-style row with geometry.type and geometry.coordinates."""
    geometry_type = get_value(row, "geometry.type")
    coordinates = _as_list(get_value(row, "geometry.coordinates"))
    if not geometry_type or coordinates is None:
        raise ValueError("GeoJSON row is missing geometry.type or geometry.coordinates")
    return shape({"type": geometry_type, "coordinates": coordinates})


def _as_list(value: Any) -> list[Any]:
    """Convert a value to a list, supporting tuple/string representations."""
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
