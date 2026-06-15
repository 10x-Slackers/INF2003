import pandas as pd

from scripts.table_models import (
    AMENITIES,
    AMENITY_TYPES,
    FLAT_MODELS,
    FLAT_TYPES,
    PROPERTIES,
    RESALE_TRANSACTIONS,
    STOREY_RANGES,
    TableModel,
    TOWNS,
)

AMENITY_TYPE_NAMES = ("gym", "park", "school")
PROPERTY_KEY_COLUMNS = (
    "town",
    "block",
    "street_name",
    "lease_commence_date",
)
PARK_DEDUPE_COLUMNS = ("amenity_name", "street_name", "postal_code")


class DatasetNormalizer:
    def __init__(self, datasets: dict[str, pd.DataFrame]) -> None:
        self.datasets: dict[str, pd.DataFrame] = datasets

    def normalize(self) -> dict[str, pd.DataFrame]:
        """
        Normalizes the datasets by performing necessary transformations and cleaning.
        Args:
            datasets: A dictionary of dataset names to their corresponding DataFrames.

        Returns:
            A dictionary of normalized dataset names to their corresponding cleaned DataFrames.
        """
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
        df = self.datasets["region_towns"].drop_duplicates("town_name")
        rows = [
            {
                "id": self.normalize_key(row.town_name),
                "name": row.town_name,
                "region": row.region_name,
            }
            for _, row in df.iterrows()
        ]
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
        storey_ranges = self.datasets["resale_flat_prices"]["storey_range"].unique()
        for ranges in storey_ranges:
            min_storey, max_storey = self.parse_storey_range(ranges)
            if min_storey == 0 and max_storey == 0:
                continue
            rows.append(
                {
                    "id": self.normalize_key(ranges),
                    "min_storey": min_storey,
                    "max_storey": max_storey,
                }
            )
        return self.create_table(STOREY_RANGES, rows)

    def transform_properties(self) -> pd.DataFrame:
        df = self.datasets["resale_flat_prices"].drop_duplicates(
            list(PROPERTY_KEY_COLUMNS)
        )
        df = self._drop_null_keys(df, PROPERTY_KEY_COLUMNS)
        df = self._drop_null_keys(df, ("town",))
        rows = [
            {
                "id": self.normalize_composite_key(
                    tuple(row[column] for column in PROPERTY_KEY_COLUMNS)
                ),
                "town_id": self.normalize_key(row.town),
                "block": row.block,
                "street_name": row.street_name,
                "lease_commence_year": row.lease_commence_date,
            }
            for _, row in df.iterrows()
        ]
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
        schools = self.datasets["schools"]
        valid_schools = schools[schools["dgp_code"].notna().astype(str).str.len() == 6]
        valid_schools = self._drop_unmatched_amenities("schools", valid_schools)
        return [
            self._amenity_row(
                town=row.dgp_code,
                amenity_type="school",
                name=row.school_name,
                street_name=row.address,
                postal_code=row.postal_code,
            )
            for _, row in valid_schools.iterrows()
        ]

    def _gym_amenity_rows(self) -> list[dict[str, object]]:
        gyms = self.datasets["gyms"]
        valid_gyms = gyms[gyms["postal_code"].astype(str).str.len() == 6]
        valid_gyms = self._drop_unmatched_amenities("gyms", valid_gyms)
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
        parks = self.datasets["parks"]
        parks = parks.drop_duplicates(list(PARK_DEDUPE_COLUMNS))
        parks = self._drop_unmatched_amenities("parks", parks)
        return [
            self._amenity_row(
                town=row.town_name,
                amenity_type="park",
                name=row.amenity_name,
                street_name=row.street_name,
                postal_code=row.postal_code,
                coordinates=row.coordinates,
            )
            for _, row in parks.iterrows()
        ]

    @staticmethod
    def _drop_unmatched_amenities(
        dataset_key: str, amenities: pd.DataFrame
    ) -> pd.DataFrame:
        if "town_name" not in amenities.columns:
            return amenities

        town_names = amenities["town_name"]
        unmatched = town_names.isna() | town_names.astype(str).str.strip().eq("")
        unmatched_count = int(unmatched.sum())
        if unmatched_count == 0:
            return amenities

        examples = amenities.loc[unmatched, "amenity_name"].dropna().head(5).tolist()
        print(
            f"Warning: Dropping {unmatched_count} {dataset_key} rows without matched town"
            f"{': ' + ', '.join(examples) if examples else ''}"
        )
        return amenities.loc[~unmatched].copy()

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
        df = self.datasets["resale_flat_prices"]
        df = self._drop_null_keys(df, PROPERTY_KEY_COLUMNS)
        df = self._drop_null_keys(df, ("town",))
        df = self._drop_null_keys(df, ("flat_type",))
        df = self._drop_null_keys(df, ("flat_model",))

        rows = [
            {
                "property_id": self.normalize_composite_key(
                    tuple(row[column] for column in PROPERTY_KEY_COLUMNS)
                ),
                "flat_type_id": self.normalize_key(row.flat_type),
                "flat_model_id": self.normalize_key(row.flat_model),
                "storey_range_id": self.normalize_key(row.storey_range),
                "floor_area_sqm": row.floor_area_sqm,
                "transaction_month": row.month,
                "resale_price": row.resale_price,
            }
            for _, row in df.iterrows()
        ]
        return self.create_table(RESALE_TRANSACTIONS, rows)

    @staticmethod
    def _coordinate_at(coordinates: tuple[object, object] | None, index: int) -> object:
        if not coordinates:
            return None
        return coordinates[index]

    @staticmethod
    def normalize_key(value: object) -> str:
        return str(value).strip().upper()

    @staticmethod
    def normalize_composite_key(values: tuple[object, ...]) -> str:
        return "_".join(str(value).strip().upper() for value in values)

    @staticmethod
    def _drop_null_keys(df: pd.DataFrame, columns: tuple[str, ...]) -> pd.DataFrame:
        null_keys_mask = df[list(columns)].isnull().any(axis=1)
        null_keys_count = int(null_keys_mask.sum())
        if null_keys_count > 0:
            examples = df.loc[null_keys_mask, "flat_type"].dropna().head(5).tolist()
            print(
                f"Warning: Dropping {null_keys_count} resale transaction rows with null property keys"
                f"{': ' + ', '.join(examples) if examples else ''}"
            )
            df = df.loc[~null_keys_mask].copy()
        return df

    @staticmethod
    def parse_storey_range(value: str) -> tuple[int, int]:
        if not isinstance(value, str) or " TO " not in value:
            print(
                f"Invalid storey range format: '{value}'. Expected format 'MIN TO MAX' (e.g., '01 TO 03')."
            )
        left, right = value.split(" TO ")
        try:
            return int(left), int(right)
        except ValueError:
            print(f"Cannot parse storey range values as integers: '{value}'.")
        return 0, 0
