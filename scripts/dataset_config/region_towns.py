from __future__ import annotations

from .base import DatasetConfig


DATASET_ID = "d_2cc750190544007400b2cfd5d7f53209"
COLUMN_NAMES: list[str] = []

DATASET = DatasetConfig(
    key="region_towns",
    dataset_id=DATASET_ID,
    column_names=COLUMN_NAMES,
)
