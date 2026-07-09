from .common import Operation, transaction_stats


def build_crossdb_operations() -> list[Operation]:
    return [
        Operation(
            "crossdb_build_global_stats",
            lambda state, _: build_global_stats(state.conn),
        ),
        Operation(
            "crossdb_build_property_stats",
            lambda state, _: build_stats(
                state.conn,
                "avg_price",
                ["property_id", "flat_type_id"],
            ),
        ),
    ]


def build_stats(conn, transaction_metric: str, groups: list[str]) -> None:
    for granularity in ["monthly", "yearly"]:
        transaction_stats(conn, transaction_metric, granularity, ["period", *groups])


def build_global_stats(conn) -> None:
    build_stats(conn, "avg_price", ["flat_type_id"])
    build_stats(conn, "avg_price_per_sqm", ["flat_type_id"])
    build_stats(conn, "avg_price", ["lease_remaining_year", "flat_type_id"])
    build_stats(conn, "avg_price", ["storey_range_id", "flat_type_id"])
