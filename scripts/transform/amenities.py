from html import unescape
import re
from typing import Any

import pandas as pd
from shapely import STRtree
from shapely.geometry import Point

from .common import clean_text, geometry_from_row, get_value, key
from .towns import TownGeometry, find_town

AMENITY_TYPES = ("School", "Park", "Gym")
DESCRIPTION_FIELD_PATTERN = re.compile(
    r"<th>\s*(.*?)\s*</th>\s*<td>\s*(.*?)\s*</td>",
    re.IGNORECASE | re.DOTALL,
)


def build_amenities(
    raw_datasets: dict[str, pd.DataFrame],
    town_geometries: dict[str, TownGeometry],
    town_tree: STRtree,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Build amenity_types and amenities DataFrames from raw datasets."""
    amenity_types = _build_amenity_types()
    valid_town_keys = set(town_geometries.keys())
    amenities = _build_amenities(
        schools=raw_datasets["schools"],
        parks=raw_datasets["parks"],
        gyms=raw_datasets["gyms"],
        valid_town_keys=valid_town_keys,
        town_geometries=town_geometries,
        town_tree=town_tree,
    )
    return amenity_types, amenities


def _build_amenity_types() -> pd.DataFrame:
    """Build the amenity_types lookup DataFrame."""
    return pd.DataFrame(
        [
            {"id": key(amenity_type), "name": amenity_type}
            for amenity_type in AMENITY_TYPES
        ]
    )


def _build_amenities(
    *,
    schools: pd.DataFrame,
    parks: pd.DataFrame,
    gyms: pd.DataFrame,
    valid_town_keys: set[str],
    town_geometries: dict[str, TownGeometry],
    town_tree: STRtree,
) -> pd.DataFrame:
    """Build the amenities DataFrame from all three raw amenity datasets."""
    rows: list[dict[str, Any]] = []
    rows.extend(_school_amenity_rows(schools, valid_town_keys))
    rows.extend(_geojson_amenity_rows(parks, "Park", town_geometries, town_tree))
    rows.extend(_geojson_amenity_rows(gyms, "Gym", town_geometries, town_tree))

    return pd.DataFrame(rows)[
        [
            "id",
            "town_key",
            "amenity_type_key",
            "name",
            "street_name",
            "postal_code",
            "longitude",
            "latitude",
        ]
    ].reset_index(drop=True)


def _school_amenity_rows(
    schools: pd.DataFrame,
    valid_town_keys: set[str],
) -> list[dict[str, Any]]:
    """Build amenity rows from the schools dataset using dgp_code -> town_key fuzzy match."""
    rows = []
    for _, row in schools.iterrows():
        raw_town_key = key(get_value(row, "dgp_code"))
        town_key = _resolve_town_key(raw_town_key, valid_town_keys)
        if town_key is None:
            continue
        name = clean_text(get_value(row, "school_name"))
        street_name = clean_text(get_value(row, "address"))
        postal_code = _postal_code(get_value(row, "postal_code"))
        rows.append(
            _amenity_row(
                amenity_type="School",
                town_key=town_key,
                name=name,
                street_name=street_name,
                postal_code=postal_code,
                longitude=None,
                latitude=None,
            )
        )
    return rows


def _geojson_amenity_rows(
    raw_amenities: pd.DataFrame,
    amenity_type: str,
    town_geometries: dict[str, TownGeometry],
    town_tree: STRtree,
) -> list[dict[str, Any]]:
    """Build amenity rows from GeoJSON amenity datasets (parks, gyms)."""
    rows = []
    for _, row in raw_amenities.iterrows():
        geometry = geometry_from_row(row)
        point = (
            geometry if isinstance(geometry, Point) else geometry.representative_point()
        )
        town = find_town(geometry, town_geometries, town_tree)

        fields = _extract_description_fields(get_value(row, "properties.Description"))
        name = clean_text(fields.get("NAME"))
        street_name = clean_text(fields.get("ADDRESSSTREETNAME"))
        postal_code = _postal_code(fields.get("ADDRESSPOSTALCODE"))

        rows.append(
            _amenity_row(
                amenity_type=amenity_type,
                town_key=town.town_key,
                name=name,
                street_name=street_name,
                postal_code=postal_code,
                longitude=round(float(point.x), 7),
                latitude=round(float(point.y), 7),
            )
        )
    return rows


def _resolve_town_key(town_key: str, valid_town_keys: set[str]) -> str | None:
    """Match a raw town key against valid keys, trying space-insensitive fallback."""
    if town_key in valid_town_keys:
        return town_key

    town_key_without_spaces = town_key.replace(" ", "")
    for valid_town_key in valid_town_keys:
        if valid_town_key.replace(" ", "") == town_key_without_spaces:
            return valid_town_key

    return None


def _extract_description_fields(description: Any) -> dict[str, str]:
    """Parse HTML description field into a dict of cleaned key-value pairs."""
    if description is None:
        return {}

    fields: dict[str, str] = {}
    for raw_key, raw_value in DESCRIPTION_FIELD_PATTERN.findall(str(description)):
        key_name = re.sub(r"[^A-Za-z0-9]", "", unescape(raw_key)).upper()
        value = clean_text(re.sub(r"<.*?>", "", unescape(raw_value)))
        fields[key_name] = value
    return fields


def _postal_code(value: Any) -> str | None:
    """Validate and normalise a Singapore postal code (6 digits, sector 1-82)."""
    text = clean_text(value)
    if not text:
        return None
    digits = re.sub(r"\D", "", text)
    if not re.fullmatch(r"\d{6}", digits):
        return None

    postal_sector = int(digits[:2])
    if not 1 <= postal_sector <= 82:
        return None

    return digits


def _amenity_row(
    *,
    amenity_type: str,
    town_key: str,
    name: str,
    street_name: str,
    postal_code: str | None,
    longitude: float | None,
    latitude: float | None,
) -> dict[str, Any]:
    """Build a single amenity row dict with composite id key."""
    amenity_type_key = key(amenity_type)
    amenity_key = "|".join(
        [
            amenity_type_key,
            town_key,
            key(name),
            key(street_name),
            postal_code or "",
        ]
    )
    return {
        "id": amenity_key,
        "town_key": town_key,
        "amenity_type_key": amenity_type_key,
        "name": name,
        "street_name": street_name,
        "postal_code": postal_code,
        "longitude": longitude,
        "latitude": latitude,
    }
