from dataclasses import dataclass
from datetime import datetime
from typing import Any

import pandas as pd
from shapely import STRtree
from shapely.geometry.base import BaseGeometry

from .common import _as_list, clean_text, geometry_from_row, get_value, key


@dataclass(frozen=True)
class TownGeometry:
    town_key: str
    town_name: str
    region: str
    geometry: BaseGeometry
    coordinates: list[Any]


class TownTransformer:
    """Build towns dataframe and spatial index."""

    def __init__(
        self, raw_datasets: dict[str, pd.DataFrame], computed_at: datetime
    ) -> None:
        self.raw_datasets = raw_datasets
        self.computed_at = computed_at
        self.town_geometries: dict[str, TownGeometry] = {}
        self.town_tree: STRtree | None = None

    def build(self) -> pd.DataFrame:
        raw_towns = self.raw_datasets["region_towns"]
        rows: list[dict[str, Any]] = []

        for _, row in raw_towns.iterrows():
            town_name = clean_text(get_value(row, "properties.PLN_AREA_N"))
            region = clean_text(get_value(row, "properties.REGION_N"))
            if not town_name or not region:
                raise ValueError(
                    "Region towns dataset includes a row without town/region"
                )

            geometry = geometry_from_row(row)
            coordinates = _as_list(get_value(row, "geometry.coordinates"))
            town_key = key(town_name)
            rows.append(
                {
                    "id": town_key,
                    "region": region,
                    "name": town_name,
                }
            )
            self.town_geometries[town_key] = TownGeometry(
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
        self.town_tree = STRtree([tg.geometry for tg in self.town_geometries.values()])
        return towns_df

    def find_town(self, geom: BaseGeometry) -> TownGeometry:
        """Find the TownGeometry that contains or best overlaps the given geometry."""
        if self.town_tree is None:
            raise RuntimeError("town_tree not built; call build() first")
        candidate_indices = [int(index) for index in self.town_tree.query(geom)]
        values = list(self.town_geometries.values())
        matches = [
            values[index]
            for index in candidate_indices
            if values[index].geometry.intersects(geom)
        ]
        if not matches:
            raise ValueError(f"Geometry does not fall within any town: {geom.wkt}")
        if len(matches) == 1:
            return matches[0]

        return max(
            matches,
            key=lambda town: town.geometry.intersection(geom).area,
        )
