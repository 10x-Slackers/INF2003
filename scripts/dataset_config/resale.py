from __future__ import annotations

from .base import DatasetConfig


DATASET_ID = "d_8b84c4ee58e3cfc0ece0d773c8ca6abc"
COLUMN_NAMES: list[str] = [
    "month",
    "town",
    "flat_type",
    "block",
    "street_name",
    "storey_range",
    "floor_area_sqm",
    "flat_model",
    "lease_commence_date",
    "resale_price",
]

DATASET = DatasetConfig(
    key="resale_flat_prices",
    dataset_id=DATASET_ID,
    column_names=COLUMN_NAMES,
)
