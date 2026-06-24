from html import unescape
import re
from typing import Any

import pandas as pd
from shapely.geometry import Point

from .common import clean_text, geometry_from_row, get_value, key
from .towns import TownTransformer

AMENITY_TYPES = ("School", "Park", "Gym")
DESCRIPTION_FIELD_PATTERN = re.compile(
    r"<th>\s*(.*?)\s*</th>\s*<td>\s*(.*?)\s*</td>",
    re.IGNORECASE | re.DOTALL,
)


class AmenityTransformer:
    """Build amenity_types and amenities dataframes."""

    def __init__(
        self,
        raw_datasets: dict[str, pd.DataFrame],
        town_transformer: TownTransformer,
    ) -> None:
        self.raw_datasets = raw_datasets
        self.town_transformer = town_transformer

    def build(self) -> tuple[pd.DataFrame, pd.DataFrame]:
        amenity_types = self._build_amenity_types()
        valid_town_keys = set(self.town_transformer.town_geometries.keys())
        amenities = self._build_amenities(
            schools=self.raw_datasets["schools"],
            parks=self.raw_datasets["parks"],
            gyms=self.raw_datasets["gyms"],
            valid_town_keys=valid_town_keys,
        )
        return amenity_types, amenities

    @staticmethod
    def _build_amenity_types() -> pd.DataFrame:
        """Build the amenity_types lookup dataframe."""
        return pd.DataFrame(
            [
                {"id": key(amenity_type), "name": amenity_type}
                for amenity_type in AMENITY_TYPES
            ]
        )

    def _build_amenities(
        self,
        *,
        schools: pd.DataFrame,
        parks: pd.DataFrame,
        gyms: pd.DataFrame,
        valid_town_keys: set[str],
    ) -> pd.DataFrame:
        """Build the amenities dataframe from all three raw amenity datasets."""
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
        """Build amenity rows from the schools dataset using dgp_code to town_key fuzzy match."""
        rows = []
        for _, row in schools.iterrows():
            raw_town_key = key(get_value(row, "dgp_code"))
            town_key = self._resolve_town_key(raw_town_key, valid_town_keys)
            if town_key is None:
                continue
            name = clean_text(get_value(row, "school_name"))
            street_name = clean_text(get_value(row, "address"))
            postal_code = self._postal_code(get_value(row, "postal_code"))
            rows.append(
                self._amenity_row(
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
        """Build amenity rows from GeoJSON amenity datasets (parks, gyms)."""
        rows = []
        for _, row in raw_amenities.iterrows():
            geometry = geometry_from_row(row)
            # Use representative point for polygons, otherwise use the point itself
            point = (
                geometry
                if isinstance(geometry, Point)
                else geometry.representative_point()
            )
            town = self.town_transformer.find_town(geometry)

            fields = self._extract_description_fields(
                get_value(row, "properties.Description")
            )
            name = clean_text(fields.get("NAME"))
            street_name = clean_text(fields.get("ADDRESSSTREETNAME"))
            postal_code = self._postal_code(fields.get("ADDRESSPOSTALCODE"))

            rows.append(
                self._amenity_row(
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

    @staticmethod
    def _resolve_town_key(town_key: str, valid_town_keys: set[str]) -> str | None:
        """Match a raw town key against valid keys, trying space-insensitive fallback."""
        if town_key in valid_town_keys:
            return town_key

        town_key_without_spaces = town_key.replace(" ", "")
        for valid_town_key in valid_town_keys:
            if valid_town_key.replace(" ", "") == town_key_without_spaces:
                return valid_town_key

        return None

    @staticmethod
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

    @staticmethod
    def _postal_code(value: Any) -> str | None:
        """Validate and normalise a Singapore postal code."""
        text = clean_text(value)
        if not text:
            return None
        # Remove non-digit characters and check for 6-digit postal code
        digits = re.sub(r"\D", "", text)
        if not re.fullmatch(r"\d{6}", digits):
            return None

        # Check that the postal sector (first two digits) is valid (01-82)
        postal_sector = int(digits[:2])
        if not 1 <= postal_sector <= 82:
            return None

        return digits

    @staticmethod
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
