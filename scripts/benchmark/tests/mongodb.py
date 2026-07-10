from typing import Any

from .common import Operation


def build_mongodb_operations(context: dict[str, Any]) -> list[Operation]:
    transaction = context["transaction"]
    statistic_id = context["statisticId"]
    operations = [
        Operation(
            "mongodb_alert_match",
            lambda state, _: list(
                state.mongo.alerts.find(alert_match_filter(transaction))
            ),
        )
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


def run_mongo_explain(mongo, context: dict[str, Any]) -> list[dict[str, Any]]:
    transaction = context["transaction"]
    statistic_id = context["statisticId"]
    explainers = [
        (
            "alert_match",
            lambda: mongo.alerts.find(alert_match_filter(transaction)),
        ),
    ]
    if statistic_id:
        explainers.insert(
            0,
            (
                "statistics_lookup",
                lambda: mongo.statistics.find({"_id": statistic_id}).limit(1),
            ),
        )
    output = []
    for name, cursor in explainers:
        try:
            output.append({"name": name, "result": cursor().explain(), "error": None})
        except Exception as exc:
            output.append({"name": name, "result": None, "error": str(exc)})
    return output
