import pandas as pd

from scripts.db import Database
from scripts.models import Region, RegionTown, Town


def extract_region_town_records(data: dict) -> list[RegionTown]:
    records = []

    for feature in data.get("features", []):
        properties = feature.get("properties", {})
        region = Region(
            region_name=properties.get("REGION_N", "").strip(),
            region_code=properties.get("REGION_C", "").strip(),
        )
        town = Town(
            town_name=properties.get("PLN_AREA_N", "").strip(),
            town_code=properties.get("PLN_AREA_C", "").strip(),
            region_code=region.region_code,
        )
        records.append(RegionTown(region=region, town=town))

    return records


def extract_region_towns(data: dict) -> pd.DataFrame:
    records = extract_region_town_records(data)
    df = pd.DataFrame([record.to_record() for record in records])
    df = df.drop_duplicates()
    df = df.dropna(how="all")
    return df


def load_region_and_towns(
    cursor, db: Database, region_data: dict
) -> tuple[int, dict[str, int], dict[str, int]]:
    records = extract_region_town_records(region_data)
    region_town_df = pd.DataFrame([record.to_record() for record in records])
    region_town_df = region_town_df.drop_duplicates().dropna(how="all")

    region_ids: dict[str, int] = {}
    towns_ids: dict[str, int] = {}
    town_code_ids: dict[str, int] = {}

    for record in records:
        region_id = region_ids.get(record.region.region_code)
        if region_id is None:
            region_id = db.upsert_row(
                cursor, "regions", record.region.db_values(), "region_code"
            )
            region_ids[record.region.region_code] = region_id

        town_id = db.upsert_row(
            cursor, "towns", record.town.db_values(region_id), "town_code"
        )
        towns_ids[record.town.town_name] = town_id
        town_code_ids[record.town.town_code] = town_id

    return len(region_ids), towns_ids, town_code_ids
