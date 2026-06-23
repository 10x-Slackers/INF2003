from datetime import datetime

import pandas as pd

from scripts.transform import TransformResult
from scripts.db.mongodb import MongoDB
from scripts.db.mariadb import Database


class Load:
    def __init__(
        self, mongodb: MongoDB, mariadb: Database, dataframes: TransformResult
    ) -> None:
        self.mariadb = mariadb
        self.mongodb = mongodb
        self.dataframes: TransformResult = dataframes
        self.keys: dict[str, dict[str, str]] = {}

    def load_to_mariadb(self) -> None:
        self._load_parent_tables()
        self._load_child_tables()

    def load_to_mongodb(self) -> None:
        if not self.keys:
            raise ValueError(
                "Load MariaDB before MongoDB so foreign keys are available."
            )

        frames = self.dataframes.mongodb
        town_documents = self._prepare_mongo_towns(frames["towns"])
        statistic_documents = self._prepare_mongo_statistics(frames["statistics"])
        self.mongodb.database["towns"].insert_many(town_documents)
        self.mongodb.database["statistics"].insert_many(statistic_documents)

    def _load_child_tables(self) -> None:
        frames = self.dataframes.mariadb

        amenities = self._replace_key(
            self._replace_key(
                frames["amenities"], "town_key", "town_id", self.keys["town_ids"]
            ),
            "amenity_type_key", "amenity_type_id", self.keys["amenity_type_ids"],
        )
        self.mariadb.insert_dataframe("amenities", amenities)

        transactions = frames["resale_transactions"].copy()
        for src, tgt, key in [
            ("property_key", "property_id", "property_ids"),
            ("flat_type_key", "flat_type_id", "flat_type_ids"),
            ("flat_model_key", "flat_model_id", "flat_model_ids"),
            ("storey_range_key", "storey_range_id", "storey_range_ids"),
        ]:
            transactions = self._replace_key(
                transactions, src, tgt, self.keys[key]
            )
        self.mariadb.insert_dataframe("resale_transactions", transactions)

    def _load_parent_tables(self) -> None:
        frames = self.dataframes.mariadb

        town_ids = self.mariadb.insert_dataframe_with_id("towns", frames["towns"])
        amenity_type_ids = self.mariadb.insert_dataframe_with_id(
            "amenity_types", frames["amenity_types"]
        )
        flat_type_ids = self.mariadb.insert_dataframe_with_id(
            "flat_types", frames["flat_types"]
        )
        flat_model_ids = self.mariadb.insert_dataframe_with_id(
            "flat_models", frames["flat_models"]
        )
        storey_range_ids = self.mariadb.insert_dataframe_with_id(
            "storey_ranges", frames["storey_ranges"]
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

    def _prepare_mongo_towns(self, dataframe: pd.DataFrame) -> list[dict]:
        documents: list[dict] = []
        for document in dataframe.to_dict(orient="records"):
            town_key = document.pop("town_key")
            document["_id"] = self._get_mariadb_id(
                town_key, self.keys["town_ids"], "town_key"
            )
            summary = dict(document["transaction_summary"])
            summary["avg_resale_price_by_flat_type"] = {
                self._get_mariadb_id(
                    flat_type_key, self.keys["flat_type_ids"], "flat_type_key"
                ): average_price
                for flat_type_key, average_price in summary[
                    "avg_resale_price_by_flat_type"
                ].items()
            }
            document["transaction_summary"] = summary
            document["updated_at"] = self._mongo_timestamp(document["updated_at"])
            documents.append(document)
        return documents

    def _prepare_mongo_statistics(self, dataframe: pd.DataFrame) -> list[dict]:
        documents: list[dict] = []
        for document in dataframe.to_dict(orient="records"):
            document["_id"] = str(document.pop("stat_key"))
            dimensions = dict(document["dimensions"])
            for src, tgt, key in [
                ("town_key", "town_id", "town_ids"),
                ("flat_type_key", "flat_type_id", "flat_type_ids"),
                ("flat_model_key", "flat_model_id", "flat_model_ids"),
            ]:
                dimensions[tgt] = self._get_optional_mariadb_id(
                    dimensions.pop(src), self.keys[key], src
                )
            document["dimensions"] = dimensions
            document["computed_at"] = self._mongo_timestamp(document["computed_at"])
            documents.append(document)
        return documents

    @staticmethod
    def _get_mariadb_id(source_key, id_map: dict[str, str], key_name: str) -> str:
        mariadb_id = id_map.get(str(source_key))
        if mariadb_id is None:
            raise ValueError(f"No MariaDB ID for {key_name}: {source_key}")
        return mariadb_id

    @classmethod
    def _get_optional_mariadb_id(
        cls, source_key, id_map: dict[str, str], key_name: str
    ) -> str | None:
        """Returns the MariaDB ID for the source key, or None for ALL*/missing values."""
        if source_key is None or pd.isna(source_key):
            return None
        return cls._get_mariadb_id(source_key, id_map, key_name)

    @staticmethod
    def _mongo_timestamp(value) -> int:
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
