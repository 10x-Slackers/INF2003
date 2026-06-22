from typing import Any

ASCENDING = 1
DESCENDING = -1

ALERTS_COLLECTION = "alerts"
STATISTICS_COLLECTION = "statistics"
REVIEWS_COLLECTION = "reviews"
TOWNS_COLLECTION = "towns"
SEARCH_HISTORY_COLLECTION = "search_history"

TIMESTAMP_TYPE = ["int"]
NULLABLE_STRING_TYPE = ["null", "string"]
NULLABLE_INT_TYPE = ["null", "int", "long"]
NUMBER_TYPE = ["int", "long", "double", "decimal"]
NULLABLE_NUMBER_TYPE = ["null", "int", "long", "double", "decimal"]


def _string_array_schema() -> dict[str, Any]:
    return {
        "bsonType": "array",
        "items": {"bsonType": "string"},
    }


def _range_schema(*, numeric_type: str | list[str] = NUMBER_TYPE) -> dict[str, Any]:
    return {
        "bsonType": "object",
        "properties": {
            "min": {"bsonType": numeric_type},
            "max": {"bsonType": numeric_type},
        },
        "additionalProperties": False,
    }


def _json_schema(schema: dict[str, Any]) -> dict[str, Any]:
    return {"$jsonSchema": schema}


COLLECTION_VALIDATORS: dict[str, dict[str, Any]] = {
    ALERTS_COLLECTION: _json_schema(
        {
            "bsonType": "object",
            "required": [
                "_id",
                "user_id",
                "filters",
                "is_active",
                "created_at",
                "updated_at",
            ],
            "properties": {
                "_id": {"bsonType": "string"},
                "user_id": {"bsonType": "string"},
                "filters": {
                    "bsonType": "object",
                    "properties": {
                        "town_id": _string_array_schema(),
                        "flat_model_id": _string_array_schema(),
                        "flat_type_id": _string_array_schema(),
                        "price": _range_schema(),
                        "floor_area_sqm": _range_schema(),
                        "storey": _range_schema(numeric_type=["int", "long"]),
                        "lease_remaining": _range_schema(),
                    },
                    "additionalProperties": False,
                },
                "is_active": {"bsonType": "bool"},
                "created_at": {"bsonType": TIMESTAMP_TYPE},
                "updated_at": {"bsonType": TIMESTAMP_TYPE},
                "last_triggered_at": {"bsonType": TIMESTAMP_TYPE},
            },
            "additionalProperties": False,
        }
    ),
    STATISTICS_COLLECTION: _json_schema(
        {
            "bsonType": "object",
            "required": [
                "_id",
                "metric",
                "granularity",
                "time_range",
                "dimensions",
                "series",
                "computed_at",
            ],
            "properties": {
                "_id": {"bsonType": "string"},
                "metric": {"bsonType": "string"},
                "granularity": {"enum": ["monthly", "yearly"]},
                "time_range": {
                    "bsonType": "object",
                    "required": ["start", "end"],
                    "properties": {
                        "start": {"bsonType": "string"},
                        "end": {"bsonType": "string"},
                    },
                    "additionalProperties": False,
                },
                "dimensions": {
                    "bsonType": "object",
                    "required": ["town_id", "flat_type_id", "flat_model_id"],
                    "properties": {
                        "town_id": {"bsonType": NULLABLE_STRING_TYPE},
                        "flat_type_id": {"bsonType": NULLABLE_STRING_TYPE},
                        "flat_model_id": {"bsonType": NULLABLE_STRING_TYPE},
                    },
                    "additionalProperties": False,
                },
                "series": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "object",
                        "required": ["period", "value", "sample_size"],
                        "properties": {
                            "period": {"bsonType": "string"},
                            "value": {"bsonType": NUMBER_TYPE},
                            "sample_size": {"bsonType": ["int", "long"], "minimum": 0},
                        },
                        "additionalProperties": False,
                    },
                },
                "computed_at": {"bsonType": TIMESTAMP_TYPE},
            },
            "additionalProperties": False,
        }
    ),
    REVIEWS_COLLECTION: _json_schema(
        {
            "bsonType": "object",
            "required": [
                "_id",
                "user_id",
                "property_id",
                "rating",
                "pros",
                "cons",
                "created_at",
                "updated_at",
            ],
            "properties": {
                "_id": {"bsonType": "string"},
                "user_id": {"bsonType": "string"},
                "property_id": {"bsonType": "string"},
                "rating": {"bsonType": ["int", "long"], "minimum": 1, "maximum": 5},
                "pros": _string_array_schema(),
                "cons": _string_array_schema(),
                "remarks": {"bsonType": "string"},
                "created_at": {"bsonType": TIMESTAMP_TYPE},
                "updated_at": {"bsonType": TIMESTAMP_TYPE},
            },
            "additionalProperties": False,
        }
    ),
    TOWNS_COLLECTION: _json_schema(
        {
            "bsonType": "object",
            "required": ["_id", "transaction_summary", "coordinates", "updated_at"],
            "properties": {
                "_id": {"bsonType": "string"},
                "transaction_summary": {
                    "bsonType": "object",
                    "required": [
                        "total_transaction",
                        "earliest_transaction",
                        "latest_transaction",
                        "avg_resale_price_by_flat_type",
                    ],
                    "properties": {
                        "total_transaction": {
                            "bsonType": ["int", "long"],
                            "minimum": 0,
                        },
                        "earliest_transaction": {"bsonType": "string"},
                        "latest_transaction": {"bsonType": "string"},
                        "avg_resale_price_by_flat_type": {
                            "bsonType": "object",
                            "additionalProperties": {
                                "bsonType": ["int", "long", "double", "decimal"]
                            },
                        },
                    },
                    "additionalProperties": False,
                },
                "coordinates": {
                    "bsonType": "array",
                },
                "updated_at": {"bsonType": TIMESTAMP_TYPE},
            },
            "additionalProperties": False,
        }
    ),
    SEARCH_HISTORY_COLLECTION: _json_schema(
        {
            "bsonType": "object",
            "required": ["_id", "user_id", "query", "searched_at"],
            "properties": {
                "_id": {"bsonType": "string"},
                "user_id": {"bsonType": "string"},
                "query": {
                    "bsonType": "object",
                    "properties": {
                        "town_id": _string_array_schema(),
                        "flat_type_id": _string_array_schema(),
                        "min_price": {"bsonType": NUMBER_TYPE},
                        "max_price": {"bsonType": NUMBER_TYPE},
                        "floor_area_min": {"bsonType": NUMBER_TYPE},
                        "floor_area_max": {"bsonType": NUMBER_TYPE},
                        "storey_min": {"bsonType": NULLABLE_INT_TYPE},
                        "storey_max": {"bsonType": NULLABLE_INT_TYPE},
                        "lease_remaining_min": {"bsonType": NULLABLE_NUMBER_TYPE},
                        "lease_remaining_max": {"bsonType": NULLABLE_NUMBER_TYPE},
                        "transaction_year_from": {"bsonType": NULLABLE_INT_TYPE},
                        "transaction_year_to": {"bsonType": NULLABLE_INT_TYPE},
                    },
                    "additionalProperties": False,
                },
                "searched_at": {"bsonType": TIMESTAMP_TYPE},
            },
            "additionalProperties": False,
        }
    ),
}

COLLECTION_INDEXES: dict[str, list[tuple[str, list[tuple[str, int]]]]] = {
    ALERTS_COLLECTION: [
        ("alerts_user_active_idx", [("user_id", ASCENDING), ("is_active", ASCENDING)]),
        (
            "alerts_active_last_triggered_idx",
            [("is_active", ASCENDING), ("last_triggered_at", DESCENDING)],
        ),
        ("alerts_town_idx", [("filters.town_id", ASCENDING)]),
        ("alerts_flat_type_idx", [("filters.flat_type_id", ASCENDING)]),
        ("alerts_flat_model_idx", [("filters.flat_model_id", ASCENDING)]),
    ],
    STATISTICS_COLLECTION: [
        (
            "statistics_lookup_idx",
            [
                ("metric", ASCENDING),
                ("granularity", ASCENDING),
                ("dimensions.town_id", ASCENDING),
                ("dimensions.flat_type_id", ASCENDING),
                ("dimensions.flat_model_id", ASCENDING),
            ],
        ),
        ("statistics_computed_at_idx", [("computed_at", DESCENDING)]),
    ],
    REVIEWS_COLLECTION: [
        ("reviews_user_idx", [("user_id", ASCENDING), ("created_at", DESCENDING)]),
        (
            "reviews_property_idx",
            [("property_id", ASCENDING), ("created_at", DESCENDING)],
        ),
    ],
    TOWNS_COLLECTION: [
        (
            "towns_latest_transaction_idx",
            [("transaction_summary.latest_transaction", DESCENDING)],
        ),
        ("towns_updated_at_idx", [("updated_at", DESCENDING)]),
    ],
    SEARCH_HISTORY_COLLECTION: [
        (
            "search_history_user_time_idx",
            [("user_id", ASCENDING), ("searched_at", DESCENDING)],
        ),
        ("search_history_town_idx", [("query.town_id", ASCENDING)]),
        ("search_history_flat_type_idx", [("query.flat_type_id", ASCENDING)]),
    ],
}

MONGODB_COLLECTION_VALIDATORS = COLLECTION_VALIDATORS
MONGODB_COLLECTION_INDEXES = COLLECTION_INDEXES
