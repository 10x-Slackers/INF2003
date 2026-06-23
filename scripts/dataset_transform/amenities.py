from html import unescape
import re
from typing import Any

import pandas as pd
from shapely.geometry import Point
from shapely.geometry.base import BaseGeometry

from scripts.dataset_transform.common import (
    clean_text,
    geometry_from_row,
    get_value,
    key,
)
from scripts.dataset_transform.towns import TownGeometry


AMENITY_TYPES = ("School", "Park", "Gym")
DESCRIPTION_FIELD_PATTERN = re.compile(
    r"<th>\s*(.*?)\s*</th>\s*<td>\s*(.*?)\s*</td>",
    re.IGNORECASE | re.DOTALL,
)


class AmenityTransformer:
    def _transform_amenity_types(self) -> pd.DataFrame:
        return pd.DataFrame(
            [
                {"id": key(amenity_type), "name": amenity_type}
                for amenity_type in AMENITY_TYPES
            ]
        )

    def _transform_amenities(
        self,
        *,
        schools: pd.DataFrame,
        parks: pd.DataFrame,
        gyms: pd.DataFrame,
        valid_town_keys: set[str],
    ) -> pd.DataFrame:
        rows: list[dict[str, Any]] = []
        rows.extend(self._school_amenity_rows(schools, valid_town_keys))
        rows.extend(self._geojson_amenity_rows(parks, "Park"))
        rows.extend(self._geojson_amenity_rows(gyms, "Gym"))

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
        self,
        schools: pd.DataFrame,
        valid_town_keys: set[str],
    ) -> list[dict[str, Any]]:
        rows = []
        for _, row in schools.iterrows():
            raw_town_key = key(get_value(row, "dgp_code"))
            town_key = _resolve_town_key(raw_town_key, valid_town_keys)
            if town_key is None:
                print("School row has unresolvable town key, skipping:", raw_town_key)
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
        self,
        raw_amenities: pd.DataFrame,
        amenity_type: str,
    ) -> list[dict[str, Any]]:
        rows = []
        for _, row in raw_amenities.iterrows():
            geometry = geometry_from_row(row)
            point = (
                geometry
                if isinstance(geometry, Point)
                else geometry.representative_point()
            )
            town = self._find_town(geometry)

            fields = _extract_description_fields(
                get_value(row, "properties.Description")
            )
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

    def _find_town(self, amenity_geometry: BaseGeometry) -> TownGeometry:
        raise NotImplementedError


def _resolve_town_key(town_key: str, valid_town_keys: set[str]) -> str | None:
    if town_key in valid_town_keys:
        return town_key

    town_key_without_spaces = town_key.replace(" ", "")
    for valid_town_key in valid_town_keys:
        if valid_town_key.replace(" ", "") == town_key_without_spaces:
            return valid_town_key

    return None


def _extract_description_fields(description: Any) -> dict[str, str]:
    if description is None:
        return {}

    fields: dict[str, str] = {}
    for raw_key, raw_value in DESCRIPTION_FIELD_PATTERN.findall(str(description)):
        key_name = re.sub(r"[^A-Za-z0-9]", "", unescape(raw_key)).upper()
        value = clean_text(re.sub(r"<.*?>", "", unescape(raw_value)))
        fields[key_name] = value
    return fields


def _postal_code(value: Any) -> str | None:
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
