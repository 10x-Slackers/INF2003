from __future__ import annotations

from .base import DatasetConfig


DATASET_ID = "d_99b71f5d34cf57a3a592fbfdef1f42b6"
COLUMN_NAMES: list[str] = []

DATASET = DatasetConfig(
    key="parks",
    dataset_id=DATASET_ID,
    column_names=COLUMN_NAMES,
)
