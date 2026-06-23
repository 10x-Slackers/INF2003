from dataclasses import dataclass


@dataclass
class DatasetConfig:
    key: str
    dataset_id: str
    column_names: list[str]
    filters: list[dict[str, str]]


RESALE = DatasetConfig(
    key="resale_flat_prices",
    dataset_id="d_8b84c4ee58e3cfc0ece0d773c8ca6abc",
    column_names=[
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
    ],
    filters=[],
)

SCHOOLS = DatasetConfig(
    key="schools",
    dataset_id="d_688b934f82c1059ed0a6993d2a829089",
    column_names=[
        "school_name",
        "address",
        "postal_code",
        "dgp_code",
    ],
    filters=[],
)

GYMS = DatasetConfig(
    key="gyms",
    dataset_id="d_b3ae090692ecf632116c9885cfbd3424",
    column_names=[],
    filters=[],
)

PARKS = DatasetConfig(
    key="parks",
    dataset_id="d_99b71f5d34cf57a3a592fbfdef1f42b6",
    column_names=[],
    filters=[],
)

REGION_TOWNS = DatasetConfig(
    key="region_towns",
    dataset_id="d_2cc750190544007400b2cfd5d7f53209",
    column_names=[],
    filters=[],
)

DATASETS = (
    RESALE,
    SCHOOLS,
    GYMS,
    PARKS,
    REGION_TOWNS,
)
