from dataclasses import dataclass
from datetime import datetime
from typing import Any

import pandas as pd
from shapely import STRtree
from shapely.geometry.base import BaseGeometry

from .common import as_list, clean_text, geometry_from_row, get_value, key


@dataclass(frozen=True)
class TownGeometry:
    town_key: str
    town_name: str
    region: str
    geometry: BaseGeometry
    coordinates: list[Any]


def build_towns(
    raw_datasets: dict[str, pd.DataFrame], computed_at: datetime
) -> tuple[pd.DataFrame, dict[str, TownGeometry], STRtree]:
    """Build towns dataframe, town_geometries dict, and STRtree spatial index."""
    raw_towns = raw_datasets["region_towns"]
    rows: list[dict[str, Any]] = []
    town_geometries: dict[str, TownGeometry] = {}

    for _, row in raw_towns.iterrows():
        town_name = clean_text(get_value(row, "properties.PLN_AREA_N"))
        region = clean_text(get_value(row, "properties.REGION_N"))
        if not town_name or not region:
            raise ValueError("Region towns dataset includes a row without town/region")

        geometry = geometry_from_row(row)
        coordinates = as_list(get_value(row, "geometry.coordinates"))
        town_key = key(town_name)
        rows.append(
            {
                "id": town_key,
                "region": region,
                "name": town_name,
            }
        )
        town_geometries[town_key] = TownGeometry(
            town_key=town_key,
            town_name=town_name,
            region=region,
            geometry=geometry,
            coordinates=coordinates,
        )

    towns_df = (
        pd.DataFrame(rows)
        .drop_duplicates(subset=["id"])
        .sort_values("id")
        .reset_index(drop=True)
    )
    town_tree = STRtree([tg.geometry for tg in town_geometries.values()])
    return towns_df, town_geometries, town_tree


def find_town(
    geom: BaseGeometry, town_geometries: dict[str, TownGeometry], town_tree: STRtree
) -> TownGeometry:
    """Find the TownGeometry that contains or best overlaps the given geometry."""
    candidate_indices = [int(index) for index in town_tree.query(geom)]
    matches = [
        town_geometries[list(town_geometries.keys())[index]]
        for index in candidate_indices
        if list(town_geometries.values())[index].geometry.intersects(geom)
    ]
    if not matches:
        raise ValueError(f"Geometry does not fall within any town: {geom.wkt}")
    if len(matches) == 1:
        return matches[0]

    return max(
        matches,
        key=lambda town: town.geometry.intersection(geom).area,
    )
