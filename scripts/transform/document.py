from datetime import UTC, datetime
from typing import Any

import pandas as pd

from .towns import TownTransformer


class DocumentTransformer:
    """Build town documents from resale transactions."""

    def __init__(
        self,
        town_transformer: TownTransformer,
        computed_at: datetime,
    ) -> None:
        self.town_transformer = town_transformer
        self.computed_at = computed_at

    def build_towns(self, resale_transactions_df: pd.DataFrame) -> pd.DataFrame:
        """Build town documents with transaction summaries."""
        rows: list[dict[str, Any]] = []
        coordinates_by_town: dict[str, list[str]] = {
            town_key: tg.coordinates
            for town_key, tg in self.town_transformer.town_geometries.items()
        }
        timestamp = self._iso_timestamp(self.computed_at)
        month_str = pd.to_datetime(
            resale_transactions_df["transaction_month"]
        ).dt.strftime("%Y-%m")

        for town_key, group in resale_transactions_df.groupby("town_key", sort=True):
            town_key = str(town_key)
            group_months = month_str.loc[group.index]
            avg_prices = (
                group.groupby("flat_type_key", sort=True)["resale_price"]
                .mean()
                .round(2)
                .to_dict()
            )
            rows.append(
                {
                    "_id": town_key,
                    "town_key": town_key,
                    "transaction_summary": {
                        "total_transaction": int(len(group.index)),
                        "earliest_transaction": str(group_months.min()),
                        "latest_transaction": str(group_months.max()),
                        "avg_resale_price_by_flat_type": {
                            str(flat_type_key): float(value)
                            for flat_type_key, value in avg_prices.items()
                        },
                    },
                    "coordinates": coordinates_by_town.get(town_key, []),
                    "updated_at": timestamp,
                }
            )

        return pd.DataFrame(rows)

    @staticmethod
    def _iso_timestamp(value: datetime) -> str:
        """Format a datetime as an ISO-8601 string with Z suffix."""
        if value.tzinfo is None:
            value = value.replace(tzinfo=UTC)
        return value.astimezone(UTC).isoformat().replace("+00:00", "Z")
