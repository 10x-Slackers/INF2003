from dataclasses import dataclass


@dataclass
class DatasetConfig:
    key: str
    dataset_id: str
    column_names: list[str]
    filters: list[dict[str, str]]
