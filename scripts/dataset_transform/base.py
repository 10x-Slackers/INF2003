from dataclasses import dataclass
from datetime import UTC, datetime

import pandas as pd
from shapely import STRtree

from scripts.dataset_config import DATASETS
from scripts.dataset_transform.amenities import AmenityTransformer
from scripts.dataset_transform.mongodb import MongoTransformer
from scripts.dataset_transform.resale import ResaleTransformer
from scripts.dataset_transform.towns import TownGeometry, TownTransformer


@dataclass(frozen=True)
class TransformResult:
    mariadb: dict[str, pd.DataFrame]
    mongodb: dict[str, pd.DataFrame]


class DatasetTransformer(
    TownTransformer,
    ResaleTransformer,
    AmenityTransformer,
    MongoTransformer,
):
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
            valid_town_keys=set(towns["id"]),
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


def transform_datasets(
    raw_datasets: dict[str, pd.DataFrame],
    *,
    computed_at: datetime | None = None,
) -> TransformResult:
    return DatasetTransformer(raw_datasets, computed_at=computed_at).transform()
