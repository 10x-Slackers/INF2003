from typing import Any

from ..db import query
from .common import (
    TRANSACTION_LIST_COLUMNS,
    TRANSACTION_LIST_JOIN,
    Operation,
    list_properties,
    list_transactions,
    property_list_queries,
    transaction_stats,
)

FLAT_TYPE_INDEX = "FORCE INDEX (idx_resale_transactions_flat_type_month)"
PROPERTY_INDEX = "FORCE INDEX (idx_resale_transactions_property_month)"
NO_RESALE_INDEX = """IGNORE INDEX (
    PRIMARY,
    idx_resale_transactions_month,
    idx_resale_transactions_property_month,
    idx_resale_transactions_flat_type_month,
    idx_resale_transactions_storey_month,
    idx_resale_transactions_flat_model_month,
    idx_resale_transactions_price
)"""


def build_mariadb_operations(context: dict[str, Any]) -> list[Operation]:
    flat_type_id = context["flatTypeId"]
    return [
        Operation(
            "mariadb_list_all_transactions",
            lambda state, _: list_transactions(state.conn),
        ),
        Operation(
            "mariadb_list_transactions_by_flat_type_indexed",
            lambda state, _: list_transactions(
                state.conn,
                "WHERE rt.flat_type_id = %s",
                (flat_type_id,),
                FLAT_TYPE_INDEX,
            ),
        ),
        Operation(
            "mariadb_list_transactions_by_flat_type_unindexed",
            lambda state, _: list_transactions(
                state.conn,
                "WHERE rt.flat_type_id = %s",
                (flat_type_id,),
                NO_RESALE_INDEX,
            ),
        ),
        Operation(
            "mariadb_list_all_properties_with_latest_transaction",
            lambda state, _: list_properties(state.conn),
        ),
        Operation(
            "mariadb_list_properties_by_latest_flat_type_indexed",
            lambda state, _: list_properties(
                state.conn, flat_type_id, PROPERTY_INDEX
            ),
        ),
        Operation(
            "mariadb_list_properties_by_latest_flat_type_unindexed",
            lambda state, _: list_properties(
                state.conn, flat_type_id, NO_RESALE_INDEX
            ),
        ),
        Operation(
            "mariadb_rebuild_global_statistics",
            lambda state, _: rebuild_global_statistics(state.conn),
        ),
    ]


def build_precompute_operation(context: dict[str, Any]) -> Operation:
    flat_type_id = context["flatTypeId"]
    return Operation(
        "mariadb_precompute_one_statistics_document",
        lambda state, _: transaction_stats(
            state.conn,
            "avg_price",
            "monthly",
            ["period"],
            "WHERE rt.flat_type_id = %s",
            (flat_type_id,),
        ),
    )


def rebuild_statistics(conn, metric: str, groups: list[str]) -> None:
    for granularity in ["monthly", "yearly"]:
        transaction_stats(conn, metric, granularity, ["period", *groups])


def rebuild_global_statistics(conn) -> None:
    rebuild_statistics(conn, "avg_price", ["flat_type_id"])
    rebuild_statistics(conn, "avg_price_per_sqm", ["flat_type_id"])
    rebuild_statistics(conn, "avg_price", ["lease_remaining_year", "flat_type_id"])
    rebuild_statistics(conn, "avg_price", ["storey_range_id", "flat_type_id"])


def maria_explain_queries(context: dict[str, Any]) -> list[dict[str, Any]]:
    flat_type_id = context["flatTypeId"]

    def transaction_sql(index_hint: str = "") -> str:
        return f"""SELECT {TRANSACTION_LIST_COLUMNS}
                  FROM resale_transactions rt {index_hint}
                  {TRANSACTION_LIST_JOIN}
                  {{where}}
                  ORDER BY rt.transaction_month DESC
                  LIMIT %s OFFSET %s"""

    def property_sql(index_hint: str = "", filtered: bool = False):
        return property_list_queries(flat_type_id if filtered else None, index_hint)[0]

    global_period = "DATE_FORMAT(rt.transaction_month, '%%Y-%%m')"
    global_sql = f"""SELECT {global_period} AS period,
                            rt.flat_type_id AS flat_type_id,
                            CAST(AVG(rt.resale_price) AS DOUBLE) AS value,
                            COUNT(*) AS sample_size
                     FROM resale_transactions rt
                     JOIN properties p ON p.id = rt.property_id
                     JOIN storey_ranges sr ON sr.id = rt.storey_range_id
                     GROUP BY {global_period}, rt.flat_type_id
                     ORDER BY period, flat_type_id"""
    all_properties = property_sql()
    filtered_properties = property_sql(PROPERTY_INDEX, True)
    unindexed_properties = property_sql(NO_RESALE_INDEX, True)
    return [
        {
            "name": "list_all_transactions",
            "sql": transaction_sql().format(where=""),
            "params": (20, 0),
            "tables": ["rt"],
        },
        {
            "name": "list_transactions_by_flat_type_indexed",
            "sql": transaction_sql(FLAT_TYPE_INDEX).format(
                where="WHERE rt.flat_type_id = %s"
            ),
            "params": (flat_type_id, 20, 0),
            "tables": ["rt"],
        },
        {
            "name": "list_transactions_by_flat_type_unindexed",
            "sql": transaction_sql(NO_RESALE_INDEX).format(
                where="WHERE rt.flat_type_id = %s"
            ),
            "params": (flat_type_id, 20, 0),
            "tables": ["rt"],
        },
        {
            "name": "list_all_properties_with_latest_transaction",
            "sql": all_properties[0],
            "params": all_properties[1],
            "tables": ["rt2"],
        },
        {
            "name": "list_properties_by_latest_flat_type_indexed",
            "sql": filtered_properties[0],
            "params": filtered_properties[1],
            "tables": ["rt2"],
        },
        {
            "name": "list_properties_by_latest_flat_type_unindexed",
            "sql": unindexed_properties[0],
            "params": unindexed_properties[1],
            "tables": ["rt2"],
        },
        {
            "name": "rebuild_global_statistics",
            "sql": global_sql,
            "params": (),
            "tables": ["rt"],
        },
    ]


def run_maria_explain(conn, context: dict[str, Any]) -> list[dict[str, Any]]:
    output = []
    for item in maria_explain_queries(context):
        result = None
        error = None
        sql = f"EXPLAIN {item['sql']}"
        try:
            result = {"sql": sql, "rows": query(conn, sql, item["params"])}
        except Exception as exc:
            error = str(exc)
        output.append(
            {
                "error": error,
                "name": item["name"],
                "result": result,
                "tables": item["tables"],
            }
        )
    return output
