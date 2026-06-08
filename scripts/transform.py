import html
import re
from typing import Any, TypeAlias

import pandas as pd
from shapely import from_wkt
from shapely.geometry import shape

Payload: TypeAlias = dict[str, Any]
RawDataset: TypeAlias = pd.DataFrame | Payload


def transform_datasets(raw_datasets: dict[str, RawDataset]) -> dict[str, pd.DataFrame]:
    """
    Transforms raw datasets into cleaned DataFrames.

    Args:
        raw_datasets: raw responses from the data.gov.sg API, keyed by dataset names.
    Returns:
        A dictionary mapping dataset names to their transformed DataFrames.
    """
    dataframes = {
        dataset_key: transform_dataset(dataset_key, raw_data)
        for dataset_key, raw_data in raw_datasets.items()
    }

    town_df = dataframes.get("region_towns", pd.DataFrame())
    if town_df.empty:
        return dataframes

    for dataset_key, dataframe in dataframes.items():
        if dataset_key == "region_towns" or "polygon" not in dataframe.columns:
            continue

        dataframe["town_name"] = dataframe["polygon"].apply(
            lambda wkt: find_town_from_polygon(town_df, wkt)
        )

    return dataframes


def transform_dataset(dataset_key: str, raw_data: RawDataset) -> pd.DataFrame:
    """
    Transforms a single raw dataset into a cleaned DataFrame.

    Args:
        dataset_key: The name of the dataset.
        raw_data: The raw data for the dataset.

    Returns:
        The transformed DataFrame.
    """
    transformer = TRANSFORMERS.get(dataset_key)
    if transformer:
        return transformer(raw_data)

    if isinstance(raw_data, pd.DataFrame):
        return raw_data

    return transform_default_geojson(raw_data)


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
        pd.DataFrame(rows)
        .drop_duplicates()
        .sort_values(by=["region_name", "town_name"])
        .reset_index(drop=True)
    )


def transform_default_geojson(payload: Payload) -> pd.DataFrame:
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
        name = extract_name(properties.get("Description", "")) or properties.get(
            "Name", ""
        )
        geometry = shape(feature.get("geometry", {}))

        rows.append(
            {
                "name": name,
                "polygon": geometry.wkt,
            }
        )

    return pd.DataFrame(rows)


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


def find_town_from_polygon(town_df: pd.DataFrame, wkt: str) -> str | None:
    """
    Finds the town name that covers the given polygon.

    Args:
        town_df: The DataFrame containing town polygons.
        wkt: The WKT string of the polygon to find the town for.

    Returns:
        The name of the town that covers the polygon, or None if not found.
    """
    geometry = from_wkt(wkt)

    for _, town_row in town_df.iterrows():
        town_polygon = from_wkt(town_row["polygon"])

        if town_polygon.covers(geometry):
            return town_row["town_name"]

    return None


TRANSFORMERS = {
    "region_towns": transform_region_towns,
}
