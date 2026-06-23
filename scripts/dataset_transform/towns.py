from dataclasses import dataclass
from typing import Any

import pandas as pd
from shapely import STRtree
from shapely.geometry.base import BaseGeometry

from scripts.dataset_transform.common import (
    as_list,
    clean_text,
    geometry_from_row,
    get_value,
    key,
)


@dataclass(frozen=True)
class TownGeometry:
    town_key: str
    town_name: str
    region: str
    geometry: BaseGeometry
    coordinates: list[Any]


class TownTransformer:
    _town_geometries: list[TownGeometry]
    _town_tree: STRtree | None

    def _transform_towns(self, raw_towns: pd.DataFrame) -> pd.DataFrame:
        rows: list[dict[str, Any]] = []
        town_geometries: list[TownGeometry] = []

        for _, row in raw_towns.iterrows():
            town_name = clean_text(get_value(row, "properties.PLN_AREA_N"))
            region = clean_text(get_value(row, "properties.REGION_N"))
            if not town_name or not region:
                raise ValueError(
                    "Region towns dataset includes a row without town/region"
                )

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
            town_geometries.append(
                TownGeometry(
                    town_key=town_key,
                    town_name=town_name,
                    region=region,
                    geometry=geometry,
                    coordinates=coordinates,
                )
            )

        self._town_geometries = town_geometries
        self._town_tree = STRtree([town.geometry for town in town_geometries])
        return (
            pd.DataFrame(rows)
            .drop_duplicates(subset=["id"])
            .sort_values("id")
            .reset_index(drop=True)
        )

    def _find_town(self, amenity_geometry: BaseGeometry) -> TownGeometry:
        if self._town_tree is None:
            raise ValueError("Town spatial index has not been initialised")

        candidate_indices = [
            int(index) for index in self._town_tree.query(amenity_geometry)
        ]
        matches = [
            self._town_geometries[index]
            for index in candidate_indices
            if self._town_geometries[index].geometry.intersects(amenity_geometry)
        ]
        if not matches:
            raise ValueError(
                f"Geometry does not fall within any town: {amenity_geometry.wkt}"
            )
        if len(matches) == 1:
            return matches[0]

        return max(
            matches,
            key=lambda town: town.geometry.intersection(amenity_geometry).area,
        )
