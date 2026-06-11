from dataclasses import dataclass


@dataclass(frozen=True)
class TableModel:
    name: str
    columns: tuple[str, ...]


TOWNS = TableModel(
    name="towns",
    columns=(
        "id",
        "name",
        "region",
    ),
)

PROPERTIES = TableModel(
    name="properties",
    columns=(
        "id",
        "town_id",
        "block",
        "street_name",
        "lease_commence_year",
    ),
)

AMENITY_TYPES = TableModel(
    name="amenity_types",
    columns=("id", "name"),
)

AMENITIES = TableModel(
    name="amenities",
    columns=(
        "town_id",
        "amenity_type_id",
        "name",
        "street_name",
        "postal_code",
        "longitude",
        "latitude",
    ),
)
FLAT_TYPES = TableModel(
    name="flat_types",
    columns=("id", "name"),
)

FLAT_MODELS = TableModel(
    name="flat_models",
    columns=("id", "name"),
)

STOREY_RANGES = TableModel(
    name="storey_ranges",
    columns=(
        "id",
        "min_storey",
        "max_storey",
    ),
)

RESALE_TRANSACTIONS = TableModel(
    name="resale_transactions",
    columns=(
        "property_id",
        "flat_type_id",
        "flat_model_id",
        "storey_range_id",
        "floor_area_sqm",
        "transaction_month",
        "resale_price",
    ),
)
