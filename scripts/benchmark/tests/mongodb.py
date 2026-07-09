import time
from typing import Any
from uuid import uuid4

from .common import Operation


def build_mongodb_operations(context: dict[str, Any]) -> list[Operation]:
    transaction = context["transaction"]
    statistic_id = context["statisticId"]
    town_profile_id = context["townProfileId"]
    user_id = context["userId"]
    alert_filters = {
        "townId": [transaction["town_id"]],
        "flatTypeId": [str(transaction["flat_type_id"])],
        "price": {
            "min": max(0, float(transaction["resale_price"]) - 10000),
            "max": float(transaction["resale_price"]) + 10000,
        },
    }
    search_query = {
        **alert_filters,
        "transactionYear": {"from": transaction["year"], "to": transaction["year"]},
    }
    operations = [
        Operation(
            "mongodb_saved_alert_list",
            lambda state, _: list(
                state.mongo.alerts.find({"userId": user_id}).sort("createdAt", -1)
            ),
        ),
        Operation(
            "mongodb_saved_alert_create_delete",
            lambda state, _: create_delete_alert(state.mongo, user_id, alert_filters),
        ),
        Operation(
            "mongodb_alert_match",
            lambda state, _: list(
                state.mongo.alerts.find(alert_match_filter(transaction))
            ),
        ),
        Operation(
            "mongodb_search_log_list",
            lambda state, _: list(
                state.mongo.searchHistory.find({"userId": user_id})
                .sort("searchedAt", -1)
                .limit(50)
            ),
        ),
        Operation(
            "mongodb_search_log_create_delete",
            lambda state, _: create_delete_search_log(
                state.mongo, user_id, search_query
            ),
        ),
        Operation(
            "mongodb_town_profile_lookup",
            lambda state, _: state.mongo.towns.find_one({"_id": town_profile_id}),
        ),
        Operation(
            "mongodb_statistics_trigger_lookup",
            lambda state, _: state.mongo.statisticsTriggers.find_one(
                {"_id": "statistics"}
            ),
        ),
    ]
    if statistic_id:
        operations.insert(
            0,
            Operation(
                "mongodb_statistics_lookup",
                lambda state, _: state.mongo.statistics.find_one({"_id": statistic_id}),
            ),
        )
    return operations


def alert_match_filter(transaction: dict[str, Any]) -> dict[str, Any]:
    clauses: list[dict[str, Any]] = []

    def add_array(field: str, value: str) -> None:
        clauses.append(
            {
                "$or": [
                    {field: value},
                    {field: {"$exists": False}},
                    {field: {"$size": 0}},
                ]
            }
        )

    def add_value(field: str, value: float) -> None:
        clauses.extend(
            [
                {
                    "$or": [
                        {f"{field}.min": {"$exists": False}},
                        {f"{field}.min": {"$lte": value}},
                    ]
                },
                {
                    "$or": [
                        {f"{field}.max": {"$exists": False}},
                        {f"{field}.max": {"$gte": value}},
                    ]
                },
            ]
        )

    def add_overlap(field: str, low: int, high: int) -> None:
        clauses.extend(
            [
                {
                    "$or": [
                        {f"{field}.min": {"$exists": False}},
                        {f"{field}.min": {"$lte": high}},
                    ]
                },
                {
                    "$or": [
                        {f"{field}.max": {"$exists": False}},
                        {f"{field}.max": {"$gte": low}},
                    ]
                },
            ]
        )

    add_array("filters.townId", transaction["town_id"])
    add_array("filters.flatTypeId", str(transaction["flat_type_id"]))
    add_array("filters.flatModelId", str(transaction["flat_model_id"]))
    add_value("filters.price", float(transaction["resale_price"]))
    add_value("filters.floorAreaSqm", float(transaction["floor_area_sqm"]))
    add_overlap("filters.storey", transaction["min_storey"], transaction["max_storey"])
    add_value(
        "filters.leaseRemaining",
        99 - (transaction["year"] - transaction["lease_commence_year"]),
    )
    return {"isActive": True, "$and": clauses}


def now() -> int:
    return int(time.time())


def create_delete_alert(mongo, user_id: str, filters: dict[str, Any]) -> None:
    document = {
        "_id": str(uuid4()),
        "userId": user_id,
        "filters": filters,
        "isActive": True,
        "createdAt": now(),
        "updatedAt": now(),
    }
    mongo.alerts.insert_one(document)
    mongo.alerts.delete_one({"_id": document["_id"]})


def create_delete_search_log(mongo, user_id: str, search_query: dict[str, Any]) -> None:
    document = {
        "_id": str(uuid4()),
        "userId": user_id,
        "query": search_query,
        "searchedAt": now(),
    }
    mongo.searchHistory.insert_one(document)
    mongo.searchHistory.delete_one({"_id": document["_id"]})


def run_mongo_explain(mongo, context: dict[str, Any]) -> list[dict[str, Any]]:
    transaction = context["transaction"]
    statistic_id = context["statisticId"]
    town_profile_id = context["townProfileId"]
    user_id = context["userId"]
    explainers = [
        (
            "statistics_lookup",
            lambda: mongo.statistics.find({"_id": statistic_id}).limit(1),
        ),
        (
            "saved_alert_list",
            lambda: mongo.alerts.find({"userId": user_id}).sort("createdAt", -1),
        ),
        (
            "alert_match",
            lambda: mongo.alerts.find(alert_match_filter(transaction)),
        ),
        (
            "search_log_list",
            lambda: mongo.searchHistory.find({"userId": user_id})
            .sort("searchedAt", -1)
            .limit(50),
        ),
        (
            "town_profile_lookup",
            lambda: mongo.towns.find({"_id": town_profile_id}).limit(1),
        ),
        (
            "statistics_trigger_lookup",
            lambda: mongo.statisticsTriggers.find({"_id": "statistics"}).limit(1),
        ),
    ]
    output = []
    for name, cursor in explainers:
        try:
            output.append({"name": name, "result": cursor().explain(), "error": None})
        except Exception as exc:
            output.append({"name": name, "result": None, "error": str(exc)})
    return output
