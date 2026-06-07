from .base import DatasetConfig


DATASET = DatasetConfig(
    key="gyms",
    dataset_id="d_b3ae090692ecf632116c9885cfbd3424",
    column_names=[
        "type",
        "properties.Name",
        "properties.Description",
        "geometry.type",
        "geometry.coordinates",
    ],
    filters=[],
)
