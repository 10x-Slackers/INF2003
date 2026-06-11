import html
import re
from typing import Any, Callable, TypeAlias

import pandas as pd
from shapely import from_wkt, STRtree
from shapely.geometry import shape

Payload: TypeAlias = dict[str, Any]
RawDataset: TypeAlias = pd.DataFrame | Payload
DatasetTransform: TypeAlias = Callable[[RawDataset], pd.DataFrame]
DEFAULT_GEOJSON_COLUMNS = [
    "amenity_name",
    "polygon",
    "coordinates",
    "postal_code",
    "street_name",
]
REGION_TOWNS_COLUMNS = ["region_name", "town_name", "polygon"]
DESCRIPTION_FIELD_PATTERN = r"<th>\s*(.*?)\s*</th>\s*<td>(.*?)</td>"


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
        rows = [
            self._default_geojson_row(feature)
            for feature in payload.get("features", [])
        ]

        return pd.DataFrame(rows, columns=DEFAULT_GEOJSON_COLUMNS)

    def _default_geojson_row(self, feature: Payload) -> dict[str, object]:
        properties = feature.get("properties", {})
        fields = self.extract_description_fields(properties.get("Description", ""))
        geometry = feature.get("geometry", {})
        geo_shape = shape(geometry)

        return {
            "amenity_name": fields.get("NAME") or None,
            "polygon": geo_shape.wkt,
            "coordinates": self._extract_coordinates(geometry),
            "postal_code": fields.get("ADDRESSPOSTALCODE") or None,
            "street_name": fields.get("ADDRESSSTREETNAME") or None,
        }

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

        rows = [
            DatasetTransformer._region_town_row(feature)
            for feature in raw_data.get("features", [])
        ]

        return (
            pd.DataFrame(rows, columns=REGION_TOWNS_COLUMNS)
            .drop_duplicates()
            .sort_values(by=["region_name", "town_name"])
            .reset_index(drop=True)
        )

    @staticmethod
    def _region_town_row(feature: Payload) -> dict[str, str]:
        properties = feature.get("properties", {})
        geometry = shape(feature.get("geometry", {}))

        return {
            "region_name": properties.get("REGION_N", ""),
            "town_name": properties.get("PLN_AREA_N", ""),
            "polygon": geometry.wkt,
        }

    @staticmethod
    def _extract_coordinates(geometry: Payload) -> tuple[object, object] | None:
        coords = geometry.get("coordinates")
        if not isinstance(coords, list):
            return None

        return coords[0], coords[1]

    @staticmethod
    def extract_description_fields(description: str) -> dict[str, str]:
        fields = {}

        for key, value in re.findall(
            DESCRIPTION_FIELD_PATTERN, description, flags=re.IGNORECASE | re.DOTALL
        ):
            normalized_key = html.unescape(key).strip().upper()
            cleaned_value = html.unescape(value).strip()
            fields[normalized_key] = cleaned_value

        return fields


class TownMatcher:
    def __init__(self, town_df: pd.DataFrame) -> None:
        self.towns = []
        self.town_polygons = []
        for _, row in town_df.iterrows():
            self.towns.append(row.town_name)
            self.town_polygons.append(from_wkt(row.polygon))
        self.tree = STRtree(self.town_polygons)

    def find_town(self, wkt: str) -> str | None:
        geometry = from_wkt(wkt)
        indices = self.tree.query(geometry, predicate="covers")
        if indices.size > 0:
            return self.towns[indices[0]]
        return None
