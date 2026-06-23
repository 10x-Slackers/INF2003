from dataclasses import dataclass
from datetime import UTC, datetime

import pandas as pd

from .amenities import build_amenities
from .mongodb import build_mongo_statistics, build_mongo_towns
from .resale import build_resale
from .towns import build_towns

# Required dataset keys that must be present and non-empty in raw_datasets.
_REQUIRED_DATASETS = [
    "resale_flat_prices",
    "schools",
    "gyms",
    "parks",
    "region_towns",
]


@dataclass(frozen=True)
class TransformResult:
    mariadb: dict[str, pd.DataFrame]
    mongodb: dict[str, pd.DataFrame]


def transform_all(
    raw_datasets: dict[str, pd.DataFrame],
    computed_at: datetime | None = None,
) -> TransformResult:
    """towns -> resale -> amenities -> mongoDB documents"""
    if computed_at is None:
        computed_at = datetime.now(UTC)

    _validate_required_datasets(raw_datasets)

    towns_df, town_geometries, town_tree = build_towns(raw_datasets, computed_at)

    resale = build_resale(raw_datasets, town_geometries, computed_at)

    amenity_types, amenities = build_amenities(raw_datasets, town_geometries, town_tree)

    mongo_towns = build_mongo_towns(
        resale["resale_transactions"], town_geometries, computed_at
    )

    mongo_statistics = build_mongo_statistics(resale["resale_transactions"])

    mariadb = {
        "towns": towns_df,
        "properties": resale["properties"],
        "amenity_types": amenity_types,
        "amenities": amenities,
        "flat_types": resale["flat_types"],
        "flat_models": resale["flat_models"],
        "storey_ranges": resale["storey_ranges"],
        "resale_transactions": resale["resale_transactions"],
    }
    mongodb = {
        "towns": mongo_towns,
        "statistics": mongo_statistics,
    }

    return TransformResult(mariadb=mariadb, mongodb=mongodb)


def _validate_required_datasets(raw_datasets: dict[str, pd.DataFrame]) -> None:
    """Raise ValueError if any required dataset is missing or empty."""
    missing = [
        key
        for key in _REQUIRED_DATASETS
        if key not in raw_datasets or raw_datasets[key].empty
    ]
    if missing:
        raise ValueError(f"Missing required raw datasets: {', '.join(missing)}")
