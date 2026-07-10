from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from ..db import query

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

# Metrics mapped to SQL expression
STATISTIC_METRICS = {
    "avg_price": "CAST(AVG(rt.resale_price) AS DOUBLE)",
    "avg_price_per_sqm": "CAST(AVG(rt.resale_price / rt.floor_area_sqm) AS DOUBLE)",
    "sales_count": "COUNT(*)",
}

# Groupings mapped to SQL expression
STATISTIC_GROUPS = {
    "flat_type_id": "rt.flat_type_id",
    "lease_remaining_year": "99 - (YEAR(rt.transaction_month) - p.lease_commence_year)",
    "property_id": "rt.property_id",
    "storey_range_id": (
        "CASE WHEN sr.min_storey <= 10 THEN '1-10' "
        "WHEN sr.min_storey <= 20 THEN '11-20' ELSE '20+' END"
    ),
    "town_id": "p.town_id",
}


@dataclass
class Operation:
    name: str
    run: Callable[[Any, dict[str, Any]], Any]


def get_context(conn) -> dict[str, Any]:
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


def get_precompute_context(mongo) -> dict[str, Any]:
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


def list_transactions(
    conn,
    where: str = "",
    params: tuple[Any, ...] = (),
    index_hint: str = "",
) -> None:
    """
    List resale transactions with trusted static SQL fragments and parameter values.
    """
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


def property_list_queries(
    flat_type_id: int | None = None, index_hint: str = ""
) -> list[tuple[str, tuple[Any, ...]]]:
    latest_join = f"""LEFT JOIN (
      SELECT rt2.property_id,
             MAX(CONCAT(DATE_FORMAT(rt2.transaction_month, '%%Y%%m%%d'),
                        HEX(rt2.id))) AS latest_key
      FROM resale_transactions rt2 {index_hint}
      GROUP BY rt2.property_id
    ) latest ON latest.property_id = p.id
    LEFT JOIN resale_transactions lt
      ON lt.property_id = p.id
     AND CONCAT(DATE_FORMAT(lt.transaction_month, '%%Y%%m%%d'), HEX(lt.id))
         = latest.latest_key
    LEFT JOIN flat_types lft ON lft.id = lt.flat_type_id
    LEFT JOIN flat_models lfm ON lfm.id = lt.flat_model_id
    LEFT JOIN storey_ranges lsr ON lsr.id = lt.storey_range_id"""
    where = "WHERE lt.flat_type_id = %s" if flat_type_id is not None else ""
    params = (flat_type_id,) if flat_type_id is not None else ()
    return [
        (
            f"""SELECT {PROPERTY_LIST_COLUMNS}
                FROM properties p
                {latest_join}
                JOIN towns t ON t.id = p.town_id
                {where}
                ORDER BY p.lease_commence_year DESC, p.block, p.street_name
                LIMIT %s OFFSET %s""",
            (*params, 20, 0),
        ),
        (
            f"""SELECT COUNT(*) AS total
                FROM properties p
                {latest_join if flat_type_id is not None else ""}
                {where}""",
            params,
        ),
    ]


def list_properties(
    conn, flat_type_id: int | None = None, index_hint: str = ""
) -> None:
    for sql, params in property_list_queries(flat_type_id, index_hint):
        query(conn, sql, params)


def transaction_stats(
    conn,
    metric: str,
    granularity: str,
    groups: list[str],
    where: str = "",
    params: tuple[Any, ...] = (),
) -> None:
    if granularity not in ("monthly", "yearly"):
        raise ValueError("granularity must be monthly or yearly")
    period_format = "%%Y" if granularity == "yearly" else "%%Y-%%m"
    expressions = {
        "period": f"DATE_FORMAT(rt.transaction_month, '{period_format}')",
        **STATISTIC_GROUPS,
    }
    selected = ", ".join(f"{expressions[group]} AS {group}" for group in groups)
    group_by = ", ".join(expressions[group] for group in groups)
    order_by = ", ".join(groups)
    query(
        conn,
        f"""SELECT {selected}, {STATISTIC_METRICS[metric]} AS value,
                   COUNT(*) AS sample_size
            FROM resale_transactions rt
            JOIN properties p ON p.id = rt.property_id
            JOIN storey_ranges sr ON sr.id = rt.storey_range_id
            {where}
            GROUP BY {group_by}
            ORDER BY {order_by}""",
        params,
    )
