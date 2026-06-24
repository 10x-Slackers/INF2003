from dataclasses import dataclass
from datetime import UTC, datetime

import pandas as pd

from .amenities import AmenityTransformer
from .document import DocumentTransformer
from .resale import ResaleTransformer
from .towns import TownTransformer

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
    sql: dict[str, pd.DataFrame]
    documents: dict[str, pd.DataFrame]


class Transformer:
    """Orchestrator that runs the full transform pipeline."""

    def __init__(
        self,
        raw_datasets: dict[str, pd.DataFrame],
        computed_at: datetime | None = None,
    ) -> None:
        self.raw_datasets = raw_datasets
        self.computed_at = computed_at if computed_at is not None else datetime.now(UTC)

    def transform(self) -> TransformResult:
        """Transforms towns -> resale -> amenities -> documents. Returns a TransformResult with SQL and documents dataframes."""
        self._validate_required_datasets()

        town_tx = TownTransformer(self.raw_datasets, self.computed_at)
        towns_df = town_tx.build()

        resale_tx = ResaleTransformer(self.raw_datasets, self.computed_at)
        resale = resale_tx.build()

        amenity_tx = AmenityTransformer(self.raw_datasets, town_tx)
        amenity_types, amenities = amenity_tx.build()

        document_tx = DocumentTransformer(town_tx, self.computed_at)
        town_documents = document_tx.build_towns(resale["resale_transactions"])

        sql = {
            "towns": towns_df,
            "properties": resale["properties"],
            "amenity_types": amenity_types,
            "amenities": amenities,
            "flat_types": resale["flat_types"],
            "flat_models": resale["flat_models"],
            "storey_ranges": resale["storey_ranges"],
            "resale_transactions": resale["resale_transactions"],
        }
        documents = {
            "towns": town_documents,
        }

        return TransformResult(sql=sql, documents=documents)

    def _validate_required_datasets(self) -> None:
        """Raise ValueError if any required dataset is missing or empty."""
        missing = [
            key
            for key in _REQUIRED_DATASETS
            if key not in self.raw_datasets or self.raw_datasets[key].empty
        ]
        if missing:
            raise ValueError(f"Missing required raw datasets: {', '.join(missing)}")
