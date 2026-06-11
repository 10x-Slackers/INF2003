import pandas as pd


from scripts.table_models import (
    TOWNS,
    FLAT_TYPES,
    FLAT_MODELS,
    STOREY_RANGES,
    PROPERTIES,
    AMENITY_TYPES,
    AMENITIES,
    RESALE_TRANSACTIONS,
    TableModel,
)


class DatasetNormalizer:
    def normalize(self, datasets: dict[str, pd.DataFrame]) -> dict[str, pd.DataFrame]:
        """
        Normalizes the datasets by performing necessary transformations and cleaning.
        Args:
            datasets: A dictionary of dataset names to their corresponding DataFrames.

        Returns:
            A dictionary of normalized dataset names to their corresponding cleaned DataFrames.
        """
        self.datasets = datasets
        tables = {}
        tables["towns"] = self.transform_towns()
        tables["flat_types"] = self.transform_flat_types()
        tables["flat_models"] = self.transform_flat_models()
        tables["storey_ranges"] = self.transform_storey_ranges()
        tables["properties"] = self.transform_properties()
        tables["amenity_types"] = self.transform_amenity_types()
        tables["amenities"] = self.transform_amenities()
        tables["resale_transactions"] = self.transform_resale_transactions()
        return tables

    @staticmethod
    def create_table(model: TableModel, rows: list[dict[str, object]]) -> pd.DataFrame:
        return pd.DataFrame(rows, columns=model.columns)

    def transform_towns(self) -> pd.DataFrame:
        rows = []
        region_towns = self.datasets["region_towns"]
        for _, row in region_towns.drop_duplicates("town_name").iterrows():
            rows.append(
                {
                    "id": self.normalize_key(row.town_name),
                    "name": row.town_name,
                    "region": row.region_name,
                }
            )

        return self.create_table(TOWNS, rows)

    def transform_flat_types(self) -> pd.DataFrame:
        rows = []
        flat_types = self.datasets["resale_flat_prices"]
        for _, row in flat_types.drop_duplicates("flat_type").iterrows():
            rows.append(
                {
                    "id": self.normalize_key(row.flat_type),
                    "name": row.flat_type,
                }
            )
        return self.create_table(FLAT_TYPES, rows)

    def transform_flat_models(self) -> pd.DataFrame:
        rows = []
        flat_models = self.datasets["resale_flat_prices"]
        for _, row in flat_models.drop_duplicates("flat_model").iterrows():
            rows.append(
                {
                    "id": self.normalize_key(row.flat_model),
                    "name": row.flat_model,
                }
            )
        return self.create_table(FLAT_MODELS, rows)

    def transform_storey_ranges(self) -> pd.DataFrame:
        rows = []
        storey_ranges = self.datasets["resale_flat_prices"]
        for _, row in storey_ranges.drop_duplicates("storey_range").iterrows():
            min_storey, max_storey = self.parse_storey_range(row["storey_range"])
            rows.append(
                {
                    "id": self.normalize_key(row.storey_range),
                    "min_storey": min_storey,
                    "max_storey": max_storey,
                }
            )
        return self.create_table(STOREY_RANGES, rows)

    def transform_properties(self) -> pd.DataFrame:
        rows = []
        properties = self.datasets["resale_flat_prices"]
        for _, row in properties.drop_duplicates(
            ["town", "block", "street_name", "lease_commence_date"]
        ).iterrows():
            rows.append(
                {
                    "id": self.normalize_key(
                        (
                            row.town,
                            row.block,
                            row.street_name,
                            row.lease_commence_date,
                        )
                    ),
                    "town_id": self.normalize_key(row.town),
                    "block": row.block,
                    "street_name": row.street_name,
                    "lease_commence_year": row.lease_commence_date,
                }
            )
        return self.create_table(PROPERTIES, rows)

    def transform_amenity_types(self) -> pd.DataFrame:
        rows = []
        amenity_types = ["gym", "park", "school"]
        for amenity_type in amenity_types:
            rows.append(
                {
                    "id": self.normalize_key(amenity_type),
                    "name": amenity_type,
                }
            )
        return self.create_table(AMENITY_TYPES, rows)

    def transform_amenities(self) -> pd.DataFrame:
        rows = []
        schools = self.datasets["schools"]
        gym = self.datasets["gyms"]
        parks = self.datasets["parks"]
        for _, row in schools.iterrows():
            rows.append(
                {
                    "town_id": self.normalize_key(row.dgp_code),
                    "amenity_type_id": self.normalize_key("school"),
                    "name": row.school_name,
                    "street_name": row.address,
                    "postal_code": row.postal_code,
                    "longitude": None,
                    "latitude": None,
                }
            )
        # some gyms are using 5 digit postal code, which is invalid in Singapore.
        valid_gym = gym[gym["postal_code"].astype(str).str.len() == 6]
        for _, row in valid_gym.iterrows():
            rows.append(
                {
                    "town_id": self.normalize_key(row.town_name),
                    "amenity_type_id": self.normalize_key("gym"),
                    "name": row.amenity_name,
                    "street_name": row.street_name,
                    "postal_code": row.postal_code,
                    "longitude": row.coordinates[0] if row.coordinates else None,
                    "latitude": row.coordinates[1] if row.coordinates else None,
                }
            )
        for _, row in parks.drop_duplicates(
            ["amenity_name", "street_name", "postal_code"]
        ).iterrows():
            rows.append(
                {
                    "town_id": self.normalize_key(row.town_name),
                    "amenity_type_id": self.normalize_key("park"),
                    "name": row.amenity_name,
                    "street_name": row.street_name,
                    "postal_code": None,
                    "longitude": row.coordinates[0] if row.coordinates else None,
                    "latitude": row.coordinates[1] if row.coordinates else None,
                }
            )

        return self.create_table(AMENITIES, rows)

    def transform_resale_transactions(self) -> pd.DataFrame:
        rows = []
        resale_flat_prices = self.datasets["resale_flat_prices"]
        for _, row in resale_flat_prices.iterrows():
            rows.append(
                {
                    "property_id": self.normalize_key(
                        (
                            row.town,
                            row.block,
                            row.street_name,
                            row.lease_commence_date,
                        )
                    ),
                    "flat_type_id": self.normalize_key(row.flat_type),
                    "flat_model_id": self.normalize_key(row.flat_model),
                    "storey_range_id": self.normalize_key(row.storey_range),
                    "floor_area_sqm": row.floor_area_sqm,
                    "transaction_month": row.month,
                    "resale_price": row.resale_price,
                }
            )
        return self.create_table(RESALE_TRANSACTIONS, rows)

    @staticmethod
    def normalize_key(value: object) -> str:
        return str(value).strip().upper()

    @staticmethod
    def parse_storey_range(value: str) -> tuple[int, int]:
        left, right = value.split(" TO ")
        return int(left), int(right)
