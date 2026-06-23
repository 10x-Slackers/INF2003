from datetime import datetime
from collections.abc import Iterable
from typing import Any

import pandas as pd

from scripts.dataset_transform.common import iso_timestamp
from scripts.dataset_transform.towns import TownGeometry


class MongoTransformer:
    computed_at: datetime
    _town_geometries: list[TownGeometry]

    def _transform_mongo_towns(self, transactions: pd.DataFrame) -> pd.DataFrame:
        rows: list[dict[str, Any]] = []
        coordinates_by_town: dict[str, list[str]] = {
            town.town_key: town.coordinates for town in self._town_geometries
        }
        timestamp = iso_timestamp(self.computed_at)

        for town_key, group in transactions.groupby("town_key", sort=True):
            month_series = pd.to_datetime(group["transaction_month"]).dt.strftime(
                "%Y-%m"
            )
            avg_prices = (
                group.groupby("flat_type_key", sort=True)["resale_price"]
                .mean()
                .round(2)
                .to_dict()
            )
            rows.append(
                {
                    "_id": town_key,
                    "transaction_summary": {
                        "total_transaction": int(len(group.index)),
                        "earliest_transaction": str(month_series.min()),
                        "latest_transaction": str(month_series.max()),
                        "avg_resale_price_by_flat_type": {
                            flat_type_key: float(value)
                            for flat_type_key, value in avg_prices.items()
                        },
                    },
                    "coordinates": coordinates_by_town.get(str(town_key), []),
                    "updated_at": timestamp,
                }
            )

        return pd.DataFrame(rows)

    def _transform_mongo_statistics(self, transactions: pd.DataFrame) -> pd.DataFrame:
        rows: list[dict[str, Any]] = []
        dimension_sets: tuple[tuple[str, ...], ...] = (
            (),
            ("town_key",),
            ("flat_type_key",),
            ("town_key", "flat_type_key"),
        )

        for group_columns in dimension_sets:
            grouped_items = _grouped_items(transactions, group_columns)
            for dimension_values, group in grouped_items:
                dimensions = _stat_dimensions(group_columns, dimension_values)
                rows.append(
                    self._stat_document(
                        transactions=group,
                        granularity="monthly",
                        dimensions=dimensions,
                    )
                )
                rows.append(
                    self._stat_document(
                        transactions=group,
                        granularity="yearly",
                        dimensions=dimensions,
                    )
                )

        return pd.DataFrame(rows)

    def _stat_document(
        self,
        *,
        transactions: pd.DataFrame,
        granularity: str,
        dimensions: dict[str, Any],
    ) -> dict[str, Any]:
        period_source = pd.to_datetime(transactions["transaction_month"])
        if granularity == "monthly":
            periods = period_source.dt.strftime("%Y-%m")
        elif granularity == "yearly":
            periods = period_source.dt.strftime("%Y")
        else:
            raise ValueError(f"Unsupported statistics granularity: {granularity}")

        grouped = (
            transactions.assign(period=periods)
            .groupby("period", sort=True)
            .agg(value=("resale_price", "median"), sample_size=("resale_price", "size"))
            .reset_index()
        )
        series = [
            {
                "period": row.period,
                "value": row.value,
                "sample_size": row.sample_size,
            }
            for row in grouped.itertuples(index=False)
        ]

        return {
            "_id": _stat_key("median_resale_price", granularity, dimensions),
            "metric": "median_resale_price",
            "granularity": granularity,
            "time_range": {
                "start": series[0]["period"],
                "end": series[-1]["period"],
            },
            "dimensions": dimensions,
            "series": series,
            "computed_at": iso_timestamp(self.computed_at),
        }


def _grouped_items(
    frame: pd.DataFrame,
    group_columns: tuple[str, ...],
) -> Iterable[tuple[tuple[Any, ...], pd.DataFrame]]:
    if not group_columns:
        return [((), frame)]

    groups = []
    for values, group in frame.groupby(list(group_columns), sort=True):
        if not isinstance(values, tuple):
            values = (values,)
        groups.append((values, group))
    return groups


_DIMENSION_KEYS = {
    "town_key": "town_id",
    "flat_type_key": "flat_type_id",
    "flat_model_key": "flat_model_id",
}


def _stat_dimensions(
    group_columns: tuple[str, ...],
    values: tuple[Any, ...],
) -> dict[str, Any]:
    dimensions: dict[str, Any] = {
        "town_id": None,
        "flat_type_id": None,
        "flat_model_id": None,
    }
    for column, value in zip(group_columns, values, strict=True):
        dimensions[_DIMENSION_KEYS[column]] = value
    return dimensions


def _stat_key(metric: str, granularity: str, dimensions: dict[str, Any]) -> str:
    parts = [
        metric,
        granularity,
        dimensions.get("town_id") or "ALL_TOWNS",
        dimensions.get("flat_type_id") or "ALL_FLAT_TYPES",
        dimensions.get("flat_model_id") or "ALL_FLAT_MODELS",
    ]
    return "|".join(parts)
