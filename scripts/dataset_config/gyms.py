from __future__ import annotations

from .base import DatasetConfig


DATASET_ID = "d_b3ae090692ecf632116c9885cfbd3424"
COLUMN_NAMES: list[str] = []

DATASET = DatasetConfig(
    key="gyms",
    dataset_id=DATASET_ID,
    column_names=COLUMN_NAMES,
)
