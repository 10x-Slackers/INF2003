from datetime import datetime
from typing import Any

import pandas as pd
from pymongo import MongoClient

from transform import TransformResult

# Dimension keys remapped in statistics documents
_DIMENSION_KEYS: list[tuple[str, str]] = [
    ("town_id", "town_ids"),
    ("flat_type_id", "flat_type_ids"),
    ("flat_model_id", "flat_model_ids"),
]


def load_mongodb(
    result: TransformResult,
    mongo: MongoClient,
    id_maps: dict[str, dict[str, str]],
) -> None:
    """Load TransformResult.mongodb frames into MongoDB."""
    frames = result.mongodb
    db = mongo.inf2003

    town_documents = _prepare_mongo_towns(frames["towns"], id_maps)
    statistic_documents = _prepare_mongo_statistics(frames["statistics"], id_maps)

    if town_documents:
        db["towns"].insert_many(town_documents)
    if statistic_documents:
        db["statistics"].insert_many(statistic_documents)


def _prepare_mongo_towns(
    dataframe: pd.DataFrame,
    id_maps: dict[str, dict[str, str]],
) -> list[dict[str, Any]]:
    """Convert the towns dataframe to a list of MongoDB documents."""
    from .mariadb import _get_mariadb_id  # local import to avoid circular dependency

    town_ids = id_maps["town_ids"]
    flat_type_ids = id_maps["flat_type_ids"]
    documents: list[dict[str, Any]] = []

    for record in dataframe.to_dict(orient="records"):
        document: dict[str, Any] = dict(record)
        town_key = document.pop("town_key")
        document["_id"] = _get_mariadb_id(town_key, town_ids, "town_key")

        summary = dict(document["transaction_summary"])
        summary["avg_resale_price_by_flat_type"] = {
            _get_mariadb_id(ft_key, flat_type_ids, "flat_type_key"): avg_price
            for ft_key, avg_price in summary["avg_resale_price_by_flat_type"].items()
        }
        document["transaction_summary"] = summary
        document["updated_at"] = _mongo_timestamp(document["updated_at"])
        documents.append(document)

    return documents


def _prepare_mongo_statistics(
    dataframe: pd.DataFrame,
    id_maps: dict[str, dict[str, str]],
) -> list[dict[str, Any]]:
    """Convert the statistics dataframe to a list of MongoDB documents."""
    from .mariadb import (
        _get_optional_mariadb_id,
    )  # local import to avoid circular dependency

    documents: list[dict[str, Any]] = []

    for record in dataframe.to_dict(orient="records"):
        document: dict[str, Any] = dict(record)
        document["_id"] = str(document.pop("_id"))

        dimensions = dict(document["dimensions"])
        for dim_key, id_map_key in _DIMENSION_KEYS:
            dimensions[dim_key] = _get_optional_mariadb_id(
                dimensions.pop(dim_key), id_maps[id_map_key], dim_key
            )
        document["dimensions"] = dimensions
        document["computed_at"] = _mongo_timestamp(document["computed_at"])
        documents.append(document)

    return documents


def _mongo_timestamp(value: Any) -> int:
    """Convert value to an integer Unix timestamp (int, datetime, or ISO str)."""
    if isinstance(value, int):
        return value
    if isinstance(value, datetime):
        return int(value.timestamp())
    return int(datetime.fromisoformat(str(value).replace("Z", "+00:00")).timestamp())
