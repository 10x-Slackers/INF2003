import os
from datetime import datetime
from typing import Any, Hashable

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
        self.keys: dict[str, dict[str, str]] = {}

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
        try:
            self._load_parent_tables()
            self._load_child_tables()
            self.mariadb.commit()
        except Exception:
            print("An error occurred during loading to MariaDB. Rolling back changes.")
            self.mariadb.rollback()
            raise

    def load_to_mongodb(self) -> None:
        if not self.transform_datasets:
            raise ValueError("No transformed data available for loading.")
        if not self.mongodb:
            raise ValueError("No MongoDB connection available for loading.")
        if not self.keys:
            raise ValueError(
                "Load MariaDB before MongoDB so foreign keys are available."
            )

        frames = self.transform_datasets.mongodb
        town_documents = self._prepare_mongo_towns(frames["towns"])
        statistic_documents = self._prepare_mongo_statistics(frames["statistics"])
        self.mongodb.database["towns"].insert_many(town_documents)
        self.mongodb.database["statistics"].insert_many(statistic_documents)

    def _load_child_tables(self) -> None:
        if not self.keys:
            raise ValueError(
                "Load parent tables before child tables to get foreign keys."
            )
        frames = self.transform_datasets.mariadb

        amenities = self._replace_key(
            frames["amenities"], "town_key", "town_id", self.keys["town_ids"]
        )
        amenities = self._replace_key(
            amenities,
            "amenity_type_key",
            "amenity_type_id",
            self.keys["amenity_type_ids"],
        )
        self.mariadb.insert_dataframe("amenities", amenities)

        transactions = frames["resale_transactions"].copy()
        transactions = self._replace_key(
            transactions, "property_key", "property_id", self.keys["property_ids"]
        )
        transactions = self._replace_key(
            transactions,
            "flat_type_key",
            "flat_type_id",
            self.keys["flat_type_ids"],
        )
        transactions = self._replace_key(
            transactions,
            "flat_model_key",
            "flat_model_id",
            self.keys["flat_model_ids"],
        )
        transactions = self._replace_key(
            transactions,
            "storey_range_key",
            "storey_range_id",
            self.keys["storey_range_ids"],
        ).drop(columns=["town_key"])
        self.mariadb.insert_dataframe("resale_transactions", transactions)

    def _load_parent_tables(self) -> None:
        frames = self.transform_datasets.mariadb

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
        property_id = self.mariadb.insert_dataframe_with_id("properties", properties)

        self.keys = {
            "town_ids": town_ids,
            "amenity_type_ids": amenity_type_ids,
            "flat_type_ids": flat_type_ids,
            "flat_model_ids": flat_model_ids,
            "storey_range_ids": storey_range_ids,
            "property_ids": property_id,
        }

    def _prepare_mongo_towns(
        self, dataframe: pd.DataFrame
    ) -> list[dict[Hashable, Any]]:
        documents: list[dict[Hashable, Any]] = []
        for document in dataframe.to_dict(orient="records"):
            town_key = document.pop("town_key")
            document["_id"] = self._get_mariadb_id(
                town_key, self.keys["town_ids"], "town_key"
            )
            summary = dict(document["transaction_summary"])
            summary["avg_resale_price_by_flat_type"] = {
                self._get_mariadb_id(
                    flat_type_key,
                    self.keys["flat_type_ids"],
                    "flat_type_key",
                ): average_price
                for flat_type_key, average_price in summary[
                    "avg_resale_price_by_flat_type"
                ].items()
            }
            document["transaction_summary"] = summary
            document["updated_at"] = self._mongo_timestamp(document["updated_at"])
            documents.append(document)
        return documents

    def _prepare_mongo_statistics(
        self, dataframe: pd.DataFrame
    ) -> list[dict[Hashable, Any]]:
        documents: list[dict[Hashable, Any]] = []
        for document in dataframe.to_dict(orient="records"):
            document["_id"] = str(document.pop("stat_key"))
            dimensions = dict(document["dimensions"])
            dimensions["town_id"] = self._get_optional_mariadb_id(
                dimensions.pop("town_key"), self.keys["town_ids"], "town_key"
            )
            dimensions["flat_type_id"] = self._get_optional_mariadb_id(
                dimensions.pop("flat_type_key"),
                self.keys["flat_type_ids"],
                "flat_type_key",
            )
            dimensions["flat_model_id"] = self._get_optional_mariadb_id(
                dimensions.pop("flat_model_key"),
                self.keys["flat_model_ids"],
                "flat_model_key",
            )
            document["dimensions"] = dimensions
            document["computed_at"] = self._mongo_timestamp(document["computed_at"])
            documents.append(document)
        return documents

    @staticmethod
    def _get_mariadb_id(source_key: Any, id_map: dict[str, str], key_name: str) -> str:
        mariadb_id = id_map.get(str(source_key))
        if mariadb_id is None:
            raise ValueError(f"No MariaDB ID for {key_name}: {source_key}")
        return mariadb_id

    @classmethod
    def _get_optional_mariadb_id(
        cls, source_key: Any, id_map: dict[str, str], key_name: str
    ) -> str | None:
        """
        Returns the MariaDB ID for the given source key if it exists, otherwise returns None.
        This is needed as dimension key also contains ALL* values which do not have a corresponding MariaDB ID.
        """
        if source_key is None or bool(pd.isna(source_key)):
            return None
        return cls._get_mariadb_id(source_key, id_map, key_name)

    @staticmethod
    def _mongo_timestamp(value: Any) -> int:
        if isinstance(value, int):
            return value
        if isinstance(value, datetime):
            return int(value.timestamp())
        return int(
            datetime.fromisoformat(str(value).replace("Z", "+00:00")).timestamp()
        )

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
        loader = Load(
            "v2:9014eec42fec26e6355db0bf611d5ae58edad9ede6e68108ca59d190fa5ae2bf:QyLukoit5tWykUL0YvEvm8lnkQbeg2F2"
        )
        loader.load_to_mariadb()
        loader.load_to_mongodb()
    finally:
        if loader is not None:
            loader.mariadb.close()
            loader.mongodb.close()


if __name__ == "__main__":
    main()
