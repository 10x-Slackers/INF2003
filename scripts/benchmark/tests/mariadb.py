from typing import Any

from ..db import query
from .common import (
    TRANSACTION_LIST_COLUMNS,
    TRANSACTION_LIST_JOIN,
    Operation,
    list_transactions,
    transaction_stats,
)


def build_mariadb_operations(context: dict[str, Any]) -> list[Operation]:
    transaction = context["transaction"]
    price_min = max(0, float(transaction["resale_price"]) - 10000)
    price_max = float(transaction["resale_price"]) + 10000

    return [
        Operation(
            "mariadb_list_transactions_all",
            lambda state, _: list_transactions(state.conn),
        ),
        Operation(
            "mariadb_list_transactions_town",
            lambda state, _: list_transactions(
                state.conn, "WHERE p.town_id = %s", (transaction["town_id"],)
            ),
        ),
        Operation(
            "mariadb_list_transactions_flat_type",
            lambda state, _: list_transactions(
                state.conn,
                "WHERE rt.flat_type_id = %s",
                (transaction["flat_type_id"],),
            ),
        ),
        Operation(
            "mariadb_list_transactions_year",
            lambda state, _: list_transactions(
                state.conn,
                "WHERE YEAR(rt.transaction_month) = %s",
                (transaction["year"],),
            ),
        ),
        Operation(
            "mariadb_list_transactions_price",
            lambda state, _: list_transactions(
                state.conn,
                "WHERE rt.resale_price >= %s AND rt.resale_price <= %s",
                (price_min, price_max),
            ),
        ),
        Operation(
            "mariadb_stats_by_flat_type",
            lambda state, _: transaction_stats(
                state.conn, "avg_price", "monthly", ["flat_type_id"]
            ),
        ),
        Operation(
            "mariadb_stats_by_town",
            lambda state, _: transaction_stats(
                state.conn, "avg_price", "monthly", ["town_id", "flat_type_id"]
            ),
        ),
        Operation(
            "mariadb_stats_by_property",
            lambda state, _: transaction_stats(
                state.conn,
                "avg_price",
                "monthly",
                ["property_id", "flat_type_id"],
                "WHERE rt.property_id = %s",
                (transaction["property_id"],),
            ),
        ),
    ]


def maria_explain_queries(context: dict[str, Any]) -> list[dict[str, Any]]:
    transaction = context["transaction"]

    def list_sql(where: str = "") -> str:
        return f"""SELECT {TRANSACTION_LIST_COLUMNS}
                  FROM resale_transactions rt
                  {TRANSACTION_LIST_JOIN}
                  {where}
                  ORDER BY rt.transaction_month DESC
                  LIMIT %s OFFSET %s"""

    def stats_sql(select_groups: str, group_by: str, where: str = "") -> str:
        return f"""SELECT {select_groups},
                         CAST(AVG(rt.resale_price) AS DOUBLE) AS value,
                         COUNT(*) AS sample_size
                  FROM resale_transactions rt
                  JOIN properties p ON p.id = rt.property_id
                  JOIN storey_ranges sr ON sr.id = rt.storey_range_id
                  {where}
                  GROUP BY {group_by}
                  ORDER BY {group_by}"""

    return [
        {"name": "list_transactions_all", "sql": list_sql(), "params": (20, 0)},
        {
            "name": "list_transactions_town",
            "sql": list_sql("WHERE p.town_id = %s"),
            "params": (transaction["town_id"], 20, 0),
        },
        {
            "name": "list_transactions_flat_type",
            "sql": list_sql("WHERE rt.flat_type_id = %s"),
            "params": (transaction["flat_type_id"], 20, 0),
        },
        {
            "name": "list_transactions_year",
            "sql": list_sql("WHERE YEAR(rt.transaction_month) = %s"),
            "params": (transaction["year"], 20, 0),
        },
        {
            "name": "list_transactions_price",
            "sql": list_sql("WHERE rt.resale_price >= %s AND rt.resale_price <= %s"),
            "params": (
                max(0, float(transaction["resale_price"]) - 10000),
                float(transaction["resale_price"]) + 10000,
                20,
                0,
            ),
        },
        {
            "name": "stats_by_flat_type",
            "sql": stats_sql("rt.flat_type_id AS flat_type_id", "rt.flat_type_id"),
            "params": (),
        },
        {
            "name": "stats_by_town",
            "sql": stats_sql(
                "p.town_id AS town_id, rt.flat_type_id AS flat_type_id",
                "p.town_id, rt.flat_type_id",
            ),
            "params": (),
        },
        {
            "name": "stats_by_property",
            "sql": stats_sql(
                "rt.property_id AS property_id, rt.flat_type_id AS flat_type_id",
                "rt.property_id, rt.flat_type_id",
                "WHERE rt.property_id = %s",
            ),
            "params": (transaction["property_id"],),
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
        output.append({"error": error, "name": item["name"], "result": result})
    return output
