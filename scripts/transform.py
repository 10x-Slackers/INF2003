import html
import re
from typing import Any, Callable, TypeAlias

import pandas as pd
from shapely import from_wkt
from shapely.geometry import shape

Payload: TypeAlias = dict[str, Any]
RawDataset: TypeAlias = pd.DataFrame | Payload
DatasetTransform: TypeAlias = Callable[[RawDataset], pd.DataFrame]
DEFAULT_GEOJSON_COLUMNS = ["name", "polygon"]
REGION_TOWNS_COLUMNS = ["region_name", "town_name", "polygon"]


class DatasetTransformer:
    def __init__(self) -> None:
        self.transformers = {
            "region_towns": self.transform_region_towns,
        }
        self.town_matcher: TownMatcher

    def transform_datasets(
        self, raw_datasets: dict[str, RawDataset]
    ) -> dict[str, pd.DataFrame]:
        """
        Transforms raw datasets into cleaned DataFrames.

        Args:
            raw_datasets: raw responses from the data.gov.sg API, keyed by dataset names.
        Returns:
            A dictionary mapping dataset names to their transformed DataFrames.
        """
        dataframes = {
            dataset_key: self.transform_dataset(dataset_key, raw_data)
            for dataset_key, raw_data in raw_datasets.items()
        }
        town_df = dataframes.get("region_towns", pd.DataFrame())
        if town_df.empty:
            raise ValueError(
                "Region towns dataset must be transformed before other datasets."
            )
        self.town_matcher = TownMatcher(town_df)
        self.add_town_names(dataframes)
        return dataframes

    def transform_dataset(self, dataset_key: str, raw_data: RawDataset) -> pd.DataFrame:
        """
        Transforms a single raw dataset into a cleaned DataFrame.

        Args:
            dataset_key: The name of the dataset.
            raw_data: The raw data for the dataset.

        Returns:
            The transformed DataFrame.
        """
        transformer = self.transformers.get(dataset_key)
        if transformer:
            return transformer(raw_data)

        if isinstance(raw_data, pd.DataFrame):
            return raw_data

        return self.transform_default_geojson(raw_data)

    def add_town_names(self, dataframes: dict[str, pd.DataFrame]) -> None:
        town_df = dataframes.get("region_towns", pd.DataFrame())
        if town_df.empty:
            return

        for dataset_key, dataframe in dataframes.items():
            if dataset_key == "region_towns" or "polygon" not in dataframe.columns:
                continue

            dataframe["town_name"] = dataframe["polygon"].apply(
                self.town_matcher.find_town
            )

    def transform_default_geojson(self, payload: Payload) -> pd.DataFrame:
        """
        Transforms a default GeoJSON payload into a cleaned DataFrame.

        Args:
            payload: The raw GeoJSON payload.

        Returns:
            The transformed DataFrame.
        """
        rows = []
        for feature in payload.get("features", []):
            properties = feature.get("properties", {})
            name = self.extract_name(
                properties.get("Description", "")
            ) or properties.get("Name", "")
            geometry = shape(feature.get("geometry", {}))

            rows.append(
                {
                    "name": name,
                    "polygon": geometry.wkt,
                }
            )

        return pd.DataFrame(rows, columns=DEFAULT_GEOJSON_COLUMNS)

    @staticmethod
    def transform_region_towns(raw_data: RawDataset) -> pd.DataFrame:
        """
        Transforms the raw region towns dataset into a cleaned DataFrame with columns:
            - region_name
            - town_name
            - polygon (in WKT format)
        Args:
            raw_data: The raw data for the region towns dataset.
        Returns:
            The transformed DataFrame.
        """
        if isinstance(raw_data, pd.DataFrame):
            return raw_data

        rows = []
        for feature in raw_data.get("features", []):
            properties = feature.get("properties", {})
            geometry = shape(feature.get("geometry", {}))

            rows.append(
                {
                    "region_name": properties.get("REGION_N", ""),
                    "town_name": properties.get("PLN_AREA_N", ""),
                    "polygon": geometry.wkt,
                }
            )

        return (
            pd.DataFrame(rows, columns=REGION_TOWNS_COLUMNS)
            .drop_duplicates()
            .sort_values(by=["region_name", "town_name"])
            .reset_index(drop=True)
        )

    @staticmethod
    def extract_name(description: str) -> str:
        """
        Extracts the name from a description html string.

        Args:
            description: The description string.

        Returns:
            The extracted name.
        """
        pattern = r"<th>\s*Name\s*</th>\s*<td>(.*?)</td>"
        match = re.search(pattern, description, flags=re.IGNORECASE | re.DOTALL)

        if not match:
            return ""

        return html.unescape(match.group(1)).strip()


class TownMatcher:
    def __init__(self, town_df: pd.DataFrame) -> None:
        self.towns = [
            (town_row["town_name"], from_wkt(town_row["polygon"]))
            for _, town_row in town_df.iterrows()
        ]

    def find_town(self, wkt: str) -> str | None:
        geometry = from_wkt(wkt)
        for town_name, town_polygon in self.towns:
            if town_polygon.covers(geometry):
                return town_name
        return None
