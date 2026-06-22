import os

import pandas as pd

from scripts.extract import DataGovDatasetClient
from scripts.dataset_config import DATASETS
from scripts.transform import TransformResult, transform_datasets
import scripts.db as databases


class Load:
    def __init__(
        self,
        api_key: str | None = None,
    ) -> None:
        self.mariadb = self.get_mariadb_connection()
        self.mongodb = self.get_mongodb_connection()
        self.client = DataGovDatasetClient(api_key=api_key)
        self.dataframes: dict[str, pd.DataFrame] = self.extract_datasets()
        self.transform_datasets: TransformResult = self.transform()

    def extract_datasets(self) -> dict[str, pd.DataFrame]:
        dataframes: dict[str, pd.DataFrame] = {}
        for config in DATASETS:
            dataframe = self.client.fetch_dataset(config)
            dataframes[config.key] = dataframe
            print(f"Dataset '{config.key}' extracted.")
        return dataframes

    def transform(self) -> TransformResult:
        if not self.dataframes:
            raise ValueError("No dataframes available for transformation.")
        transformed_data = transform_datasets(self.dataframes)
        return transformed_data

    def load_to_mariadb(self) -> None:
        if not self.transform_datasets:
            raise ValueError("No transformed data available for loading.")
        if not self.mariadb:
            raise ValueError("No MariaDB connection available for loading.")
        frames = self.transform_datasets.mariadb

        try:
            town_ids = self.mariadb.insert_dataframe_with_id("towns", frames["towns"])
            amenity_type_ids = self.mariadb.insert_dataframe_with_id(
                "amenity_types",
                frames["amenity_types"],
            )
            flat_type_ids = self.mariadb.insert_dataframe_with_id(
                "flat_types",
                frames["flat_types"],
            )
            flat_model_ids = self.mariadb.insert_dataframe_with_id(
                "flat_models",
                frames["flat_models"],
            )
            storey_range_ids = self.mariadb.insert_dataframe_with_id(
                "storey_ranges",
                frames["storey_ranges"],
            )

            properties = self._replace_key(
                frames["properties"], "town_key", "town_id", town_ids
            )
            property_ids = self.mariadb.insert_dataframe_with_id(
                "properties", properties
            )

            amenities = self._replace_key(
                frames["amenities"], "town_key", "town_id", town_ids
            )
            amenities = self._replace_key(
                amenities,
                "amenity_type_key",
                "amenity_type_id",
                amenity_type_ids,
            )
            self.mariadb.insert_dataframe("amenities", amenities)

            transactions = frames["resale_transactions"].copy()
            transactions = self._replace_key(
                transactions, "property_key", "property_id", property_ids
            )
            transactions = self._replace_key(
                transactions, "flat_type_key", "flat_type_id", flat_type_ids
            )
            transactions = self._replace_key(
                transactions, "flat_model_key", "flat_model_id", flat_model_ids
            )
            transactions = self._replace_key(
                transactions,
                "storey_range_key",
                "storey_range_id",
                storey_range_ids,
            ).drop(columns=["town_key", "lease_commence_year"])
            self.mariadb.insert_dataframe("resale_transactions", transactions)
            self.mariadb.commit()
        except Exception:
            self.mariadb.rollback()
            raise

    @staticmethod
    def _replace_key(
        dataframe: pd.DataFrame,
        source_column: str,
        target_column: str,
        id_map: dict[str, str],
    ) -> pd.DataFrame:
        if source_column not in dataframe.columns:
            raise ValueError(f"Missing source key column '{source_column}'")

        result = dataframe.copy()
        result[target_column] = result[source_column].astype(str).map(id_map)
        missing = sorted(
            result.loc[result[target_column].isna(), source_column]
            .astype(str)
            .unique()
            .tolist()
        )
        if missing:
            raise ValueError(
                f"Unresolved foreign keys for '{source_column}': " + ", ".join(missing)
            )

        return result.drop(columns=source_column)

    @staticmethod
    def get_mariadb_connection() -> databases.Database:
        mariadb = databases.Database(
            host=os.environ.get("DB_HOST", "mariadb"),
            user=os.environ.get("DB_USER", "root"),
            password=os.environ.get("DB_PASSWORD", "P@ssw0rd"),
            database=os.environ.get("DB_NAME", "inf2003"),
        )
        try:
            mariadb.reset_tables()
        except Exception as e:
            print(f"An error occurred while resetting tables: {e}")
            mariadb.rollback()
            raise
        return mariadb

    @staticmethod
    def get_mongodb_connection() -> databases.MongoDB:
        return databases.setup_mongodb()


def main() -> None:
    loader: Load | None = None
    try:
        loader = Load(api_key=os.environ.get("DATA_GOV_API_KEY"))
        loader.load_to_mariadb()
    finally:
        if loader is not None:
            loader.mariadb.close()
            loader.mongodb.close()


if __name__ == "__main__":
    main()
