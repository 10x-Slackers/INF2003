import pandas as pd

from scripts.table_models import (
    AMENITIES,
    AMENITY_TYPES,
    FLAT_MODELS,
    FLAT_TYPES,
    PROPERTIES,
    RESALE_TRANSACTIONS,
    STOREY_RANGES,
    TOWNS,
    TableModel,
)

AMENITY_TYPE_NAMES = ("gym", "park", "school")
PROPERTY_KEY_COLUMNS = ("town", "block", "street_name", "lease_commence_date")
PARK_DEDUPE_COLUMNS = ("amenity_name", "street_name", "postal_code")


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

    def _create_id_name_table(
        self, model: TableModel, values: pd.Series | list[str] | tuple[str, ...]
    ) -> pd.DataFrame:
        rows = [
            {
                "id": self.normalize_key(value),
                "name": value,
            }
            for value in values
        ]
        return self.create_table(model, rows)

    def _create_id_name_table_from_dataset(
        self, model: TableModel, dataset_key: str, column: str
    ) -> pd.DataFrame:
        """
        Creates a table with 'id' and 'name' columns from a specified column in a dataset.
        Used mostly for tables with two column (id, name)
        Args:
            model: The TableModel defining the structure of the table to create.
            dataset_key: The key of the dataset to extract values from.
            column: The column name in the dataset to drop duplicates and extract values from.
        returns:
            A DataFrame with 'id' and 'name' columns based on the specified dataset and column.
        """
        values = self.datasets[dataset_key].drop_duplicates(column)[column]
        return self._create_id_name_table(model, values)

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
        return self._create_id_name_table_from_dataset(
            FLAT_TYPES, "resale_flat_prices", "flat_type"
        )

    def transform_flat_models(self) -> pd.DataFrame:
        return self._create_id_name_table_from_dataset(
            FLAT_MODELS, "resale_flat_prices", "flat_model"
        )

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
        for row in properties.drop_duplicates(list(PROPERTY_KEY_COLUMNS)).itertuples():
            rows.append(
                {
                    "id": self._property_id(row),
                    "town_id": self.normalize_key(row.town),
                    "block": row.block,
                    "street_name": row.street_name,
                    "lease_commence_year": row.lease_commence_date,
                }
            )
        return self.create_table(PROPERTIES, rows)

    def transform_amenity_types(self) -> pd.DataFrame:
        return self._create_id_name_table(AMENITY_TYPES, AMENITY_TYPE_NAMES)

    def transform_amenities(self) -> pd.DataFrame:
        rows = [
            *self._school_amenity_rows(),
            *self._gym_amenity_rows(),
            *self._park_amenity_rows(),
        ]
        return self.create_table(AMENITIES, rows)

    def _school_amenity_rows(self) -> list[dict[str, object]]:
        return [
            self._amenity_row(
                town=row.dgp_code,
                amenity_type="school",
                name=row.school_name,
                street_name=row.address,
                postal_code=row.postal_code,
            )
            for _, row in self.datasets["schools"].iterrows()
        ]

    def _gym_amenity_rows(self) -> list[dict[str, object]]:
        gyms = self.datasets["gyms"]
        # some gyms are using 5 digit postal code, which is invalid in Singapore.
        valid_gyms = gyms[gyms["postal_code"].astype(str).str.len() == 6]
        return [
            self._amenity_row(
                town=row.town_name,
                amenity_type="gym",
                name=row.amenity_name,
                street_name=row.street_name,
                postal_code=row.postal_code,
                coordinates=row.coordinates,
            )
            for _, row in valid_gyms.iterrows()
        ]

    def _park_amenity_rows(self) -> list[dict[str, object]]:
        # check dataset for parks, looks like all postal codes are 0 in the dataset,, so we just set it to None
        parks = self.datasets["parks"].drop_duplicates(list(PARK_DEDUPE_COLUMNS))
        return [
            self._amenity_row(
                town=row.town_name,
                amenity_type="park",
                name=row.amenity_name,
                street_name=row.street_name,
                postal_code=row.postal_code
                if row.postal_code not in (None, 0, "0")
                else None,
                coordinates=row.coordinates,
            )
            for _, row in parks.iterrows()
        ]

    def _amenity_row(
        self,
        *,
        town: object,
        amenity_type: str,
        name: object,
        street_name: object,
        postal_code: object,
        coordinates: tuple[object, object] | None = None,
    ) -> dict[str, object]:
        return {
            "town_id": self.normalize_key(town),
            "amenity_type_id": self.normalize_key(amenity_type),
            "name": name,
            "street_name": street_name,
            "postal_code": postal_code,
            "longitude": self._coordinate_at(coordinates, 0),
            "latitude": self._coordinate_at(coordinates, 1),
        }

    def transform_resale_transactions(self) -> pd.DataFrame:
        rows = []
        resale_flat_prices = self.datasets["resale_flat_prices"]
        for row in resale_flat_prices.itertuples():
            rows.append(
                {
                    "property_id": self._property_id(row),
                    "flat_type_id": self.normalize_key(row.flat_type),
                    "flat_model_id": self.normalize_key(row.flat_model),
                    "storey_range_id": self.normalize_key(row.storey_range),
                    "floor_area_sqm": row.floor_area_sqm,
                    "transaction_month": row.month,
                    "resale_price": row.resale_price,
                }
            )
        return self.create_table(RESALE_TRANSACTIONS, rows)

    def _property_id(self, row: tuple) -> str:
        return self.normalize_key(
            tuple(getattr(row, column) for column in PROPERTY_KEY_COLUMNS)
        )

    @staticmethod
    def _coordinate_at(coordinates: tuple[object, object] | None, index: int) -> object:
        if not coordinates:
            return None
        return coordinates[index]

    @staticmethod
    def normalize_key(value: object) -> str:
        return str(value).strip().upper()

    @staticmethod
    def parse_storey_range(value: str) -> tuple[int, int]:
        if not isinstance(value, str) or " TO " not in value:
            raise ValueError(
                f"Invalid storey range format: '{value}'. Expected format 'MIN TO MAX' (e.g., '01 TO 03')."
            )
        left, right = value.split(" TO ")
        try:
            return int(left), int(right)
        except ValueError:
            raise ValueError(
                f"Cannot parse storey range values as integers: '{value}'."
            )
