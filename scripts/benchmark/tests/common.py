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


def get_context(conn, mongo) -> dict[str, Any]:
    """
    get a context dictionary containing a sample for statistic, user and transaction
    """
    sample = query(
        conn,
        """SELECT rt.property_id, p.town_id, rt.flat_type_id, rt.flat_model_id,
                  rt.storey_range_id, YEAR(rt.transaction_month) AS year,
                  rt.resale_price, rt.floor_area_sqm, p.lease_commence_year,
                  sr.min_storey, sr.max_storey
           FROM resale_transactions rt
           JOIN properties p ON p.id = rt.property_id
           JOIN storey_ranges sr ON sr.id = rt.storey_range_id
           ORDER BY rt.transaction_month DESC
           LIMIT 1""",
    )
    users = query(conn, "SELECT id FROM users ORDER BY created_at LIMIT 1")
    statistic = mongo.statistics.find_one({}, sort=[("_id", 1)])

    if not sample:
        raise RuntimeError("No resale transaction rows found for benchmarking.")
    if not users:
        raise RuntimeError(
            "No users found. Run USER_PASSWORD=P@ssw0rd pnpm seed:users."
        )

    return {
        "statisticId": statistic["_id"] if statistic else None,
        "transaction": sample[0],
        "userId": users[0]["id"],
    }


def list_transactions(conn, where: str = "", params: tuple[Any, ...] = ()) -> None:
    """
    List resale transactions with optional filtering.
    """
    query(
        conn,
        f"""SELECT {TRANSACTION_LIST_COLUMNS}
            FROM resale_transactions rt
            {TRANSACTION_LIST_JOIN}
            {where}
            ORDER BY rt.transaction_month DESC
            LIMIT %s OFFSET %s""",
        (*params, 20, 0),
    )
    query(
        conn,
        f"""SELECT COUNT(*) AS total
            FROM resale_transactions rt
            {TRANSACTION_LIST_JOIN}
            {where}""",
        params,
    )


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
