import re
from typing import Any

import pandas as pd

from .common import clean_text, key

RESALE_TOWN_TO_TOWN_AREA = {
    "CENTRAL AREA": "DOWNTOWN CORE",
    "KALLANG/WHAMPOA": "KALLANG",
}
STOREY_RANGE_PATTERN = re.compile(r"^\s*(\d+)\s+TO\s+(\d+)\s*$", re.IGNORECASE)


class ResaleTransformer:
    """Build resale transaction dataframes."""

    def __init__(self, raw_datasets: dict[str, pd.DataFrame]) -> None:
        self.raw_datasets = raw_datasets

    def build(self) -> dict[str, pd.DataFrame]:
        raw_resale = self.raw_datasets["resale_flat_prices"]
        resale = raw_resale.copy()

        resale["town_key"] = resale["town"].map(key).replace(RESALE_TOWN_TO_TOWN_AREA)
        resale["flat_type_key"] = resale["flat_type"].map(key)
        resale["flat_model_key"] = resale["flat_model"].map(key)
        resale["block"] = resale["block"].map(clean_text)
        resale["street_name"] = resale["street_name"].map(clean_text)
        resale["lease_commence_year"] = (
            pd.to_numeric(resale["lease_commence_date"], errors="coerce")
            .fillna(0)
            .astype(int)
        )
        resale["floor_area_sqm"] = pd.to_numeric(
            resale["floor_area_sqm"], errors="raise"
        )
        resale["resale_price"] = pd.to_numeric(resale["resale_price"], errors="raise")
        resale["transaction_month"] = pd.to_datetime(
            resale["month"], errors="raise"
        ).dt.date

        storey_bounds = resale["storey_range"].map(self._parse_storey_range)
        resale["min_storey"] = [bounds[0] for bounds in storey_bounds]
        resale["max_storey"] = [bounds[1] for bounds in storey_bounds]
        resale["storey_range_key"] = [
            self._storey_range_key(min_s, max_s) for min_s, max_s in storey_bounds
        ]
        resale["property_key"] = (
            resale["town_key"]
            + "|"
            + resale["block"].map(key)
            + "|"
            + resale["street_name"].map(key)
            + "|"
            + resale["lease_commence_year"].astype(str)
        )
        resale["transaction_key"] = [f"resale:{i}" for i in range(1, len(resale) + 1)]

        properties = self._dedupe_sort(
            pd.DataFrame(
                {
                    "id": resale["property_key"],
                    "town_key": resale["town_key"],
                    "block": resale["block"],
                    "street_name": resale["street_name"],
                    "lease_commence_year": resale["lease_commence_year"],
                }
            ),
            ["id"],
        )
        flat_types = self._lookup_frame(resale["flat_type_key"], resale["flat_type"])
        flat_models = self._lookup_frame(resale["flat_model_key"], resale["flat_model"])
        storey_ranges = self._dedupe_sort(
            pd.DataFrame(
                {
                    "id": resale["storey_range_key"],
                    "min_storey": resale["min_storey"],
                    "max_storey": resale["max_storey"],
                }
            ),
            ["min_storey", "max_storey"],
        )
        transactions = pd.DataFrame(
            {
                "id": resale["transaction_key"],
                "property_key": resale["property_key"],
                "flat_type_key": resale["flat_type_key"],
                "flat_model_key": resale["flat_model_key"],
                "storey_range_key": resale["storey_range_key"],
                "floor_area_sqm": resale["floor_area_sqm"],
                "transaction_month": resale["transaction_month"],
                "resale_price": resale["resale_price"],
                "town_key": resale["town_key"],
            }
        ).reset_index(drop=True)

        return {
            "properties": properties,
            "flat_types": flat_types,
            "flat_models": flat_models,
            "storey_ranges": storey_ranges,
            "resale_transactions": transactions,
        }

    @staticmethod
    def _storey_range_key(min_storey: int, max_storey: int) -> str:
        """Build a composite key for a storey range, e.g. '01-03'."""
        return f"{min_storey:02d}-{max_storey:02d}"

    @staticmethod
    def _parse_storey_range(value: Any) -> tuple[int, int]:
        """Parse a 'X TO Y' storey range string into (min, max) ints."""
        match = STOREY_RANGE_PATTERN.match(clean_text(value))
        if not match:
            raise ValueError(f"Invalid storey_range: {value}")
        min_storey = int(match.group(1))
        max_storey = int(match.group(2))
        if min_storey > max_storey:
            raise ValueError(f"Invalid storey_range min > max: {value}")
        return min_storey, max_storey

    @staticmethod
    def _lookup_frame(keys: pd.Series, names: pd.Series) -> pd.DataFrame:
        """Build a deduplicated lookup DataFrame from key and name series."""
        frame = pd.DataFrame(
            {
                "id": keys,
                "name": names.map(clean_text),
            }
        )
        return ResaleTransformer._dedupe_sort(frame, ["id"])

    @staticmethod
    def _dedupe_sort(frame: pd.DataFrame, sort_columns: list[str]) -> pd.DataFrame:
        """Drop duplicate rows, sort, and reset index."""
        return frame.drop_duplicates().sort_values(sort_columns).reset_index(drop=True)
