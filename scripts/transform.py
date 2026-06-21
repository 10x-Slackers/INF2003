from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from html import unescape
import ast
import re
from typing import Any, Iterable

import pandas as pd
from shapely.geometry import Point, shape
from shapely.geometry.base import BaseGeometry
from dataset_config import DATASETS
from shapely import STRtree


AMENITY_TYPES = ("School", "Park", "Gym")
DESCRIPTION_FIELD_PATTERN = re.compile(
    r"<th>\s*(.*?)\s*</th>\s*<td>\s*(.*?)\s*</td>",
    re.IGNORECASE | re.DOTALL,
)
STOREY_RANGE_PATTERN = re.compile(r"^\s*(\d+)\s+TO\s+(\d+)\s*$", re.IGNORECASE)


@dataclass(frozen=True)
class TransformResult:
    mariadb: dict[str, pd.DataFrame]
    mongodb: dict[str, pd.DataFrame]


@dataclass(frozen=True)
class TownGeometry:
    town_key: str
    town_name: str
    region: str
    geometry: BaseGeometry
    coordinates: list[Any]


class DatasetTransformer:
    def __init__(
        self,
        raw_datasets: dict[str, pd.DataFrame],
        *,
        computed_at: datetime | None = None,
    ) -> None:
        self.raw_datasets = raw_datasets
        self.computed_at = computed_at or datetime.now(UTC)
        self._town_geometries: list[TownGeometry] = []
        self._town_tree: STRtree | None = None

    def transform(self) -> TransformResult:
        self._validate_required_datasets()

        towns = self._transform_towns(self.raw_datasets["region_towns"])
        resale_frames = self._transform_resale(self.raw_datasets["resale_flat_prices"])
        amenities = self._transform_amenities(
            schools=self.raw_datasets["schools"],
            parks=self.raw_datasets["parks"],
            gyms=self.raw_datasets["gyms"],
            valid_town_keys=set(towns["town_key"]),
        )

        mariadb = {
            "towns": towns,
            "properties": resale_frames["properties"],
            "amenity_types": self._transform_amenity_types(),
            "amenities": amenities,
            "flat_types": resale_frames["flat_types"],
            "flat_models": resale_frames["flat_models"],
            "storey_ranges": resale_frames["storey_ranges"],
            "resale_transactions": resale_frames["resale_transactions"],
        }
        mongodb = {
            "towns": self._transform_mongo_towns(
                resale_frames["resale_transactions"],
            ),
            "statistics": self._transform_mongo_statistics(
                resale_frames["resale_transactions"],
            ),
        }

        return TransformResult(mariadb=mariadb, mongodb=mongodb)

    def _validate_required_datasets(self) -> None:
        missing = [
            dataset.key
            for dataset in DATASETS
            if dataset.key not in self.raw_datasets
            or self.raw_datasets[dataset.key].empty
        ]
        if missing:
            raise ValueError(f"Missing required raw datasets: {', '.join(missing)}")

    def _transform_towns(self, raw_towns: pd.DataFrame) -> pd.DataFrame:
        rows: list[dict[str, Any]] = []
        town_geometries: list[TownGeometry] = []

        for _, row in raw_towns.iterrows():
            town_name = _clean_text(_get_value(row, "properties.PLN_AREA_N"))
            region = _clean_text(_get_value(row, "properties.REGION_N"))
            if not town_name or not region:
                raise ValueError(
                    "Region towns dataset includes a row without town/region"
                )

            geometry = _geometry_from_row(row)
            coordinates = _as_list(_get_value(row, "geometry.coordinates"))
            town_key = _key(town_name)
            rows.append(
                {
                    "town_key": town_key,
                    "region": region,
                    "name": town_name,
                }
            )
            town_geometries.append(
                TownGeometry(
                    town_key=town_key,
                    town_name=town_name,
                    region=region,
                    geometry=geometry,
                    coordinates=coordinates,
                )
            )

        self._town_geometries = town_geometries
        self._town_tree = STRtree([town.geometry for town in town_geometries])
        return (
            pd.DataFrame(rows)
            .drop_duplicates(subset=["town_key"])
            .sort_values("town_key")
            .reset_index(drop=True)
        )

    def _transform_resale(self, raw_resale: pd.DataFrame) -> dict[str, pd.DataFrame]:
        resale = raw_resale.copy()

        resale["town_key"] = resale["town"].map(_key)
        resale["flat_type_key"] = resale["flat_type"].map(_key)
        resale["flat_model_key"] = resale["flat_model"].map(_key)
        resale["block"] = resale["block"].map(_clean_text)
        resale["street_name"] = resale["street_name"].map(_clean_text)
        resale["lease_commence_year"] = pd.to_numeric(
            resale["lease_commence_date"],
            errors="raise",
        ).astype(int)
        resale["floor_area_sqm"] = pd.to_numeric(
            resale["floor_area_sqm"],
            errors="raise",
        )
        resale["resale_price"] = pd.to_numeric(resale["resale_price"], errors="raise")
        resale["transaction_month"] = pd.to_datetime(
            resale["month"],
            errors="raise",
        ).dt.date

        storey_bounds = resale["storey_range"].map(_parse_storey_range)
        resale["min_storey"] = [bounds[0] for bounds in storey_bounds]
        resale["max_storey"] = [bounds[1] for bounds in storey_bounds]
        resale["storey_range_key"] = [
            _storey_range_key(min_storey, max_storey)
            for min_storey, max_storey in storey_bounds
        ]
        resale["property_key"] = (
            resale["town_key"]
            + "|"
            + resale["block"].fillna("").map(_key)
            + "|"
            + resale["street_name"].fillna("").map(_key)
            + "|"
            + resale["lease_commence_year"].astype(int).astype(str)
        )
        resale["transaction_key"] = [
            f"resale:{index + 1}" for index in range(len(resale.index))
        ]

        properties = _dedupe_sort(
            resale[
                [
                    "property_key",
                    "town_key",
                    "block",
                    "street_name",
                    "lease_commence_year",
                ]
            ],
            ["property_key"],
        )
        flat_types = _lookup_frame(resale["flat_type_key"], resale["flat_type"])
        flat_models = _lookup_frame(resale["flat_model_key"], resale["flat_model"])
        storey_ranges = _dedupe_sort(
            resale[["storey_range_key", "min_storey", "max_storey"]],
            ["min_storey", "max_storey"],
        )
        transactions = resale[
            [
                "transaction_key",
                "property_key",
                "town_key",
                "flat_type_key",
                "flat_model_key",
                "storey_range_key",
                "floor_area_sqm",
                "transaction_month",
                "resale_price",
                "lease_commence_year",
            ]
        ].reset_index(drop=True)

        return {
            "properties": properties,
            "flat_types": flat_types.rename(columns={"lookup_key": "flat_type_key"}),
            "flat_models": flat_models.rename(columns={"lookup_key": "flat_model_key"}),
            "storey_ranges": storey_ranges,
            "resale_transactions": transactions,
        }

    def _transform_amenity_types(self) -> pd.DataFrame:
        return pd.DataFrame(
            [
                {"amenity_type_key": _key(amenity_type), "name": amenity_type}
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
                "amenity_key",
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
            raw_town_key = _key(_get_value(row, "dgp_code"))
            town_key = _resolve_town_key(raw_town_key, valid_town_keys)
            if town_key is None:
                print("School row has unresolvable town key, skipping:", raw_town_key)
                continue
            name = _clean_text(_get_value(row, "school_name"))
            street_name = _clean_text(_get_value(row, "address"))
            postal_code = _postal_code(_get_value(row, "postal_code"))
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
            geometry = _geometry_from_row(row)
            point = (
                geometry
                if isinstance(geometry, Point)
                else geometry.representative_point()
            )
            town = self._find_town(geometry)

            fields = _extract_description_fields(
                _get_value(row, "properties.Description")
            )
            name = _clean_text(fields.get("NAME"))
            street_name = _clean_text(fields.get("ADDRESSSTREETNAME"))
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
        if self._town_tree is None:
            raise ValueError("Town spatial index has not been initialised")

        candidate_indices = [
            int(index) for index in self._town_tree.query(amenity_geometry)
        ]
        matches = [
            self._town_geometries[index]
            for index in candidate_indices
            if self._town_geometries[index].geometry.intersects(amenity_geometry)
        ]
        if not matches:
            raise ValueError(
                f"Geometry does not fall within any town: {amenity_geometry.wkt}"
            )
        if len(matches) == 1:
            return matches[0]

        return max(
            matches,
            key=lambda town: town.geometry.intersection(amenity_geometry).area,
        )

    def _transform_mongo_towns(self, transactions: pd.DataFrame) -> pd.DataFrame:
        rows: list[dict[str, Any]] = []
        coordinates_by_town: dict[str, list[str]] = {
            town.town_key: town.coordinates for town in self._town_geometries
        }
        timestamp = _iso_timestamp(self.computed_at)

        for town_key, group in transactions.groupby("town_key", sort=True):
            month_series = pd.to_datetime(group["transaction_month"]).dt.strftime(
                "%Y-%m"
            )
            avg_prices = (
                group.groupby("flat_type_key", sort=True)["resale_price"]
                .mean()
                .round(2)
                .to_dict()
            )
            rows.append(
                {
                    "_id": None,
                    "town_key": town_key,
                    "transaction_summary": {
                        "total_transaction": int(len(group.index)),
                        "earliest_transaction": str(month_series.min()),
                        "latest_transaction": str(month_series.max()),
                        "avg_resale_price_by_flat_type": {
                            flat_type_key: float(value)
                            for flat_type_key, value in avg_prices.items()
                        },
                    },
                    "coordinates": coordinates_by_town.get(str(town_key), []),
                    "updated_at": timestamp,
                }
            )

        return pd.DataFrame(rows)

    def _transform_mongo_statistics(self, transactions: pd.DataFrame) -> pd.DataFrame:
        rows: list[dict[str, Any]] = []
        dimension_sets: tuple[tuple[str, ...], ...] = (
            (),
            ("town_key",),
            ("flat_type_key",),
            ("town_key", "flat_type_key"),
        )

        for group_columns in dimension_sets:
            grouped_items = _grouped_items(transactions, group_columns)
            for dimension_values, group in grouped_items:
                dimensions = _stat_dimensions(group_columns, dimension_values)
                rows.append(
                    self._stat_document(
                        transactions=group,
                        granularity="monthly",
                        dimensions=dimensions,
                    )
                )
                rows.append(
                    self._stat_document(
                        transactions=group,
                        granularity="yearly",
                        dimensions=dimensions,
                    )
                )

        return pd.DataFrame(rows)

    def _stat_document(
        self,
        *,
        transactions: pd.DataFrame,
        granularity: str,
        dimensions: dict[str, Any],
    ) -> dict[str, Any]:
        period_source = pd.to_datetime(transactions["transaction_month"])
        if granularity == "monthly":
            periods = period_source.dt.strftime("%Y-%m")
        elif granularity == "yearly":
            periods = period_source.dt.strftime("%Y")
        else:
            raise ValueError(f"Unsupported statistics granularity: {granularity}")

        grouped = (
            transactions.assign(period=periods)
            .groupby("period", sort=True)
            .agg(value=("resale_price", "median"), sample_size=("resale_price", "size"))
            .reset_index()
        )
        series = [
            {
                "period": row.period,
                "value": row.value,
                "sample_size": row.sample_size,
            }
            for row in grouped.itertuples(index=False)
        ]

        return {
            "_id": None,
            "stat_key": _stat_key("median_resale_price", granularity, dimensions),
            "metric": "median_resale_price",
            "granularity": granularity,
            "time_range": {
                "start": series[0]["period"],
                "end": series[-1]["period"],
            },
            "dimensions": dimensions,
            "series": series,
            "computed_at": _iso_timestamp(self.computed_at),
        }


def transform_datasets(
    raw_datasets: dict[str, pd.DataFrame],
    *,
    computed_at: datetime | None = None,
) -> TransformResult:
    return DatasetTransformer(raw_datasets, computed_at=computed_at).transform()


def _get_value(row: pd.Series, column: str) -> Any:
    value = row.get(column)
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    return value


def _clean_text(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value).strip())


def _key(value: Any) -> str:
    return _clean_text(value).upper()


def _resolve_town_key(town_key: str, valid_town_keys: set[str]) -> str | None:
    if town_key in valid_town_keys:
        return town_key

    town_key_without_spaces = town_key.replace(" ", "")
    for valid_town_key in valid_town_keys:
        if valid_town_key.replace(" ", "") == town_key_without_spaces:
            return valid_town_key

    return None


def _property_key(
    town_key: str,
    block: str,
    street_name: str,
    lease_commence_year: int,
) -> str:
    return "|".join(
        [
            town_key,
            _key(block),
            _key(street_name),
            str(int(lease_commence_year)),
        ]
    )


def _storey_range_key(min_storey: int, max_storey: int) -> str:
    return f"{min_storey:02d}-{max_storey:02d}"


def _parse_storey_range(value: Any) -> tuple[int, int]:
    match = STOREY_RANGE_PATTERN.match(_clean_text(value))
    if not match:
        raise ValueError(f"Invalid storey_range: {value}")
    min_storey = int(match.group(1))
    max_storey = int(match.group(2))
    if min_storey > max_storey:
        raise ValueError(f"Invalid storey_range min > max: {value}")
    return min_storey, max_storey


def _lookup_frame(keys: pd.Series, names: pd.Series) -> pd.DataFrame:
    frame = pd.DataFrame(
        {
            "lookup_key": keys,
            "name": names.map(_clean_text),
        }
    )
    return _dedupe_sort(frame, ["lookup_key"])


def _dedupe_sort(frame: pd.DataFrame, sort_columns: list[str]) -> pd.DataFrame:
    return frame.drop_duplicates().sort_values(sort_columns).reset_index(drop=True)


def _geometry_from_row(row: pd.Series) -> BaseGeometry:
    geometry_type = _get_value(row, "geometry.type")
    coordinates = _as_list(_get_value(row, "geometry.coordinates"))
    if not geometry_type or coordinates is None:
        raise ValueError("GeoJSON row is missing geometry.type or geometry.coordinates")
    return shape({"type": geometry_type, "coordinates": coordinates})


def _as_list(value: Any) -> list[Any]:
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


def _extract_description_fields(description: Any) -> dict[str, str]:
    if description is None:
        return {}

    fields: dict[str, str] = {}
    for raw_key, raw_value in DESCRIPTION_FIELD_PATTERN.findall(str(description)):
        key = re.sub(r"[^A-Za-z0-9]", "", unescape(raw_key)).upper()
        value = _clean_text(re.sub(r"<.*?>", "", unescape(raw_value)))
        fields[key] = value
    return fields


def _postal_code(value: Any) -> str | None:
    text = _clean_text(value)
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
    amenity_type_key = _key(amenity_type)
    amenity_key = "|".join(
        [
            amenity_type_key,
            town_key,
            _key(name),
            _key(street_name),
            postal_code or "",
        ]
    )
    return {
        "amenity_key": amenity_key,
        "town_key": town_key,
        "amenity_type_key": amenity_type_key,
        "name": name,
        "street_name": street_name,
        "postal_code": postal_code,
        "longitude": longitude,
        "latitude": latitude,
    }


def _grouped_items(
    frame: pd.DataFrame,
    group_columns: tuple[str, ...],
) -> Iterable[tuple[tuple[Any, ...], pd.DataFrame]]:
    if not group_columns:
        return [((), frame)]

    groups = []
    for values, group in frame.groupby(list(group_columns), sort=True):
        if not isinstance(values, tuple):
            values = (values,)
        groups.append((values, group))
    return groups


def _stat_dimensions(
    group_columns: tuple[str, ...],
    values: tuple[Any, ...],
) -> dict[str, Any]:
    dimensions = {
        "town_id": None,
        "town_key": None,
        "flat_type_id": None,
        "flat_type_key": None,
        "flat_model_id": None,
        "flat_model_key": None,
    }
    for column, value in zip(group_columns, values, strict=True):
        dimensions[column] = value
    return dimensions


def _stat_key(metric: str, granularity: str, dimensions: dict[str, Any]) -> str:
    parts = [
        metric,
        granularity,
        dimensions.get("town_key") or "ALL_TOWNS",
        dimensions.get("flat_type_key") or "ALL_FLAT_TYPES",
        dimensions.get("flat_model_key") or "ALL_FLAT_MODELS",
    ]
    return "|".join(parts)


def _iso_timestamp(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")
