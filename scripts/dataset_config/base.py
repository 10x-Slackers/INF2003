from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class DatasetConfig:
    key: str
    dataset_id: str
    column_names: list[str] = field(default_factory=list)
    filters: list[dict[str, str]] = field(default_factory=list)
