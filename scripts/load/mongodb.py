from datetime import datetime
from typing import Any

import pandas as pd
from pymongo import MongoClient

from transform import TransformResult


class MongoDBLoader:
    """Loads TransformResult.documents frames into MongoDB."""

    def __init__(self, mongo: MongoClient, id_maps: dict[str, dict[str, str]]) -> None:
        self.db = mongo.inf2003
        self.id_maps = id_maps

    def load(self, result: TransformResult) -> None:
        """Load towns collection."""
        frames = result.documents

        town_documents = self._prepare_towns(frames["towns"])

        if town_documents:
            self.db["towns"].insert_many(town_documents)

    def _prepare_towns(self, dataframe: pd.DataFrame) -> list[dict[str, Any]]:
        """Convert the towns dataframe to a list of MongoDB documents."""
        town_ids = self.id_maps["town_ids"]
        flat_type_ids = self.id_maps["flat_type_ids"]
        documents: list[dict[str, Any]] = []

        for record in dataframe.to_dict(orient="records"):
            document: dict[str, Any] = dict(record)  # type: ignore
            town_key = document.pop("town_key")
            document["_id"] = self._get_mariadb_id(town_key, town_ids, "town_key")

            summary = dict(document["transactionSummary"])
            summary["transactionCountByFlatType"] = {
                self._get_mariadb_id(ft_key, flat_type_ids, "flat_type_key"): count
                for ft_key, count in summary["transactionCountByFlatType"].items()
            }
            document["transactionSummary"] = summary
            document["updatedAt"] = self._mongo_timestamp(document["updatedAt"])
            documents.append(document)

        return documents

    @staticmethod
    def _get_mariadb_id(source_key: Any, id_map: dict[str, str], key_name: str) -> str:
        """Look up a MariaDB surrogate ID for source_key."""
        mariadb_id = id_map.get(str(source_key))
        if mariadb_id is None:
            raise ValueError(f"No MariaDB ID for {key_name}: {source_key}")
        return mariadb_id

    @staticmethod
    def _mongo_timestamp(value: Any) -> int:
        """Convert value to an integer Unix timestamp (int, datetime, or ISO str)."""
        if isinstance(value, int):
            return value
        if isinstance(value, datetime):
            return int(value.timestamp())
        return int(
            datetime.fromisoformat(str(value).replace("Z", "+00:00")).timestamp()
        )
