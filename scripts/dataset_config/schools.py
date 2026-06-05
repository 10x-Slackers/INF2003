from __future__ import annotations

from .base import DatasetConfig


DATASET_ID = "d_688b934f82c1059ed0a6993d2a829089"
COLUMN_NAMES: list[str] = [
    "school_name",
    "address",
    "postal_code",
    "dgp_code",
]

DATASET = DatasetConfig(
    key="schools",
    dataset_id=DATASET_ID,
    column_names=COLUMN_NAMES,
)
