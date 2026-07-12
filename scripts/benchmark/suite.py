from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from .db import query


@dataclass
class Operation:
    name: str
    run: Callable[[Any], Any]


TRANSACTION_LIST_COLUMNS = """rt.id AS id,
       rt.uploaded_by_user_id AS uploaded_by_user_id,
       rt.property_id AS property_id, rt.flat_type_id AS flat_type_id,
       rt.flat_model_id AS flat_model_id, rt.storey_range_id AS storey_range_id,
       rt.floor_area_sqm AS floor_area_sqm, rt.transaction_month AS transaction_month,
       rt.resale_price AS resale_price, p.town_id AS town_id, t.name AS town_name,
       p.block AS block, p.street_name AS street_name,
       p.lease_commence_year AS lease_commence_year,
       ft.name AS flat_type_name, fm.name AS flat_model_name,
       sr.min_storey AS min_storey, sr.max_storey AS max_storey,
       u.name AS uploaded_by_user_name"""

TRANSACTION_LIST_JOIN = """JOIN properties p ON p.id = rt.property_id
       JOIN towns t ON t.id = p.town_id
       JOIN flat_types ft ON ft.id = rt.flat_type_id
       JOIN flat_models fm ON fm.id = rt.flat_model_id
       JOIN storey_ranges sr ON sr.id = rt.storey_range_id
       LEFT JOIN users u ON u.id = rt.uploaded_by_user_id"""

PROPERTY_LIST_COLUMNS = """p.id, p.town_id, p.block, p.street_name,
       p.lease_commence_year, t.name AS town_name,
       lt.id AS lt_id, lt.uploaded_by_user_id AS lt_uploaded_by_user_id,
       lt.property_id AS lt_property_id, lt.flat_type_id AS lt_flat_type_id,
       lt.flat_model_id AS lt_flat_model_id,
       lt.storey_range_id AS lt_storey_range_id,
       lt.floor_area_sqm AS lt_floor_area_sqm,
       lft.name AS lt_flat_type_name, lfm.name AS lt_flat_model_name,
       lsr.min_storey AS lt_min_storey, lsr.max_storey AS lt_max_storey,
       lt.resale_price AS lt_resale_price,
       lt.transaction_month AS lt_transaction_month"""

STATISTIC_METRICS = {
    "avg_price": "CAST(AVG(rt.resale_price) AS DOUBLE)",
    "avg_price_per_sqm": "CAST(AVG(rt.resale_price / rt.floor_area_sqm) AS DOUBLE)",
    "sales_count": "COUNT(*)",
}

STATISTIC_GROUPS = {
    "town_id": "p.town_id",
    "flat_type_id": "rt.flat_type_id",
    "property_id": "rt.property_id",
}

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


def get_context(conn):
    """Pick a flat type id from the most recent transaction."""
    sample = query(
        conn,
        """SELECT rt.flat_type_id
           FROM resale_transactions rt
           ORDER BY rt.transaction_month DESC
           LIMIT 1""",
    )
    if not sample:
        raise RuntimeError("No resale transaction rows found for benchmarking.")
    return {"flatTypeId": sample[0]["flat_type_id"]}


def get_precompute_context(mongo):
    """Pick a monthly flat-type statistic for the precompute comparison."""
    statistic = mongo.statistics.find_one(
        {
            "metric": "AVG_PRICE_BY_FLAT_TYPE",
            "granularity": "monthly",
            "dimensions.flatTypeId": {"$ne": None},
        },
        sort=[("_id", 1)],
    )
    if not statistic:
        raise RuntimeError("No monthly flat-type statistic found for comparison.")
    return {
        "flatTypeId": int(statistic["dimensions"]["flatTypeId"]),
        "statisticId": statistic["_id"],
    }


def list_transactions(conn, where="", params=(), index_hint=""):
    """List resale transactions (page + count)."""
    query(
        conn,
        f"""SELECT {TRANSACTION_LIST_COLUMNS}
            FROM resale_transactions rt {index_hint}
            {TRANSACTION_LIST_JOIN}
            {where}
            ORDER BY rt.transaction_month DESC
            LIMIT %s OFFSET %s""",
        (*params, 20, 0),
    )
    query(
        conn,
        f"""SELECT COUNT(*) AS total
            FROM resale_transactions rt {index_hint}
            {TRANSACTION_LIST_JOIN}
            {where}""",
        params,
    )


LATEST_TRANSACTION_JOIN = """LEFT JOIN (
  SELECT rt2.*, ROW_NUMBER() OVER (
    PARTITION BY rt2.property_id
    ORDER BY rt2.transaction_month DESC, rt2.id DESC
  ) AS rn
  FROM resale_transactions rt2 {index_hint}
) lt ON lt.property_id = p.id AND lt.rn = 1
LEFT JOIN flat_types lft ON lft.id = lt.flat_type_id
LEFT JOIN flat_models lfm ON lfm.id = lt.flat_model_id
LEFT JOIN storey_ranges lsr ON lsr.id = lt.storey_range_id"""

TOWN_JOIN = "JOIN towns t ON t.id = p.town_id"


def property_list_queries(
    flat_type_id: int | None = None, index_hint: str = ""
) -> list[tuple[str, tuple[Any, ...]]]:
    latest_join = LATEST_TRANSACTION_JOIN.format(index_hint=index_hint)
    where = "WHERE lt.flat_type_id = %s" if flat_type_id is not None else ""
    params = (flat_type_id,) if flat_type_id is not None else ()
    count_join = latest_join if flat_type_id is not None else ""
    return [
        (
            f"""SELECT {PROPERTY_LIST_COLUMNS}
                FROM properties p
                {latest_join}
                {TOWN_JOIN}
                {where}
                ORDER BY p.lease_commence_year DESC, p.block, p.street_name
                LIMIT %s OFFSET %s""",
            (*params, 20, 0),
        ),
        (
            f"""SELECT COUNT(*) AS total
                FROM properties p
                {count_join}
                {where}""",
            params,
        ),
    ]


def list_properties(conn, flat_type_id=None, index_hint=""):
    for sql, params in property_list_queries(flat_type_id, index_hint):
        query(conn, sql, params)


def transaction_stats(conn, metric, granularity, groups, where="", params=()):
    period_format = "%%Y" if granularity == "yearly" else "%%Y-%%m"
    expressions = {
        "period": f"DATE_FORMAT(rt.transaction_month, '{period_format}')",
        **STATISTIC_GROUPS,
    }
    selected = ", ".join(f"{expressions[group]} AS {group}" for group in groups)
    group_by = ", ".join(expressions[group] for group in groups)
    order_by = ", ".join(groups)
    needs_properties = "town_id" in groups or "p.town_id" in where
    property_join = (
        "JOIN properties p ON p.id = rt.property_id" if needs_properties else ""
    )
    query(
        conn,
        f"""SELECT {selected}, {STATISTIC_METRICS[metric]} AS value,
                   COUNT(*) AS sample_size
            FROM resale_transactions rt
            {property_join}
            {where}
            GROUP BY {group_by}
            ORDER BY {order_by}""",
        params,
    )


def rebuild_statistics(conn, metric, groups):
    for granularity in ["monthly", "yearly"]:
        transaction_stats(conn, metric, granularity, ["period", *groups])


def rebuild_global_statistics(conn):
    rebuild_statistics(conn, "avg_price", ["flat_type_id"])
    rebuild_statistics(conn, "avg_price_per_sqm", ["flat_type_id"])


def build_suites(context):
    flat_type_id = context["flatTypeId"]
    return [
        Operation(
            "mariadb_list_all_transactions",
            lambda conn: list_transactions(conn),
        ),
        Operation(
            "mariadb_list_transactions_by_flat_type_indexed",
            lambda conn: list_transactions(
                conn,
                "WHERE rt.flat_type_id = %s",
                (flat_type_id,),
                FLAT_TYPE_INDEX,
            ),
        ),
        Operation(
            "mariadb_list_transactions_by_flat_type_unindexed",
            lambda conn: list_transactions(
                conn,
                "WHERE rt.flat_type_id = %s",
                (flat_type_id,),
                NO_RESALE_INDEX,
            ),
        ),
        Operation(
            "mariadb_list_all_properties_with_latest_transaction",
            lambda conn: list_properties(conn),
        ),
        Operation(
            "mariadb_list_properties_by_latest_flat_type_indexed",
            lambda conn: list_properties(conn, flat_type_id, PROPERTY_INDEX),
        ),
        Operation(
            "mariadb_list_properties_by_latest_flat_type_unindexed",
            lambda conn: list_properties(conn, flat_type_id, NO_RESALE_INDEX),
        ),
        Operation(
            "mariadb_rebuild_global_statistics",
            lambda conn: rebuild_global_statistics(conn),
        ),
    ]


def build_precompute_operation(context):
    flat_type_id = context["flatTypeId"]
    return Operation(
        "mariadb_precompute_one_statistics_document",
        lambda conn: transaction_stats(
            conn,
            "avg_price",
            "monthly",
            ["period", "flat_type_id"],
            "WHERE rt.flat_type_id = %s",
            (flat_type_id,),
        ),
    )


def explain_queries(context):
    flat_type_id = context["flatTypeId"]

    def transaction_sql(index_hint=""):
        return f"""SELECT {TRANSACTION_LIST_COLUMNS}
                  FROM resale_transactions rt {index_hint}
                  {TRANSACTION_LIST_JOIN}
                  {{where}}
                  ORDER BY rt.transaction_month DESC
                  LIMIT %s OFFSET %s"""

    def property_sql(index_hint="", filtered=False):
        return property_list_queries(flat_type_id if filtered else None, index_hint)[0]

    global_period = "DATE_FORMAT(rt.transaction_month, '%%Y-%%m')"
    global_sql = f"""SELECT {global_period} AS period,
                            rt.flat_type_id AS flat_type_id,
                            CAST(AVG(rt.resale_price) AS DOUBLE) AS value,
                            COUNT(*) AS sample_size
                     FROM resale_transactions rt
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


def run_maria_explain(conn, context):
    return [
        {
            "name": item["name"],
            "tables": item["tables"],
            "rows": query(conn, f"EXPLAIN {item['sql']}", item["params"]),
        }
        for item in explain_queries(context)
    ]
