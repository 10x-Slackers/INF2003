"""Synthetic end-to-end smoke test for the cleanroom ETL pipeline.

Bypasses the extract step (no API key) by building synthetic raw_datasets
that match the expected schemas of the transform modules.
"""

import pandas as pd

from transform import transform_all
from load import load_mariadb, load_mongodb, connect_mariadb, connect_mongodb


def build_synthetic_raw_datasets() -> dict[str, pd.DataFrame]:
    """Build 5 small but valid raw DataFrames matching the extract output schemas."""

    # --- 1. Resale flat prices (CSV columns) ---
    resale_flat_prices = pd.DataFrame(
        [
            {
                "month": "2023-01",
                "town": "JURONG EAST",
                "flat_type": "3 ROOM",
                "block": "123",
                "street_name": "JURONG EAST ST 11",
                "storey_range": "01 TO 03",
                "floor_area_sqm": 68.0,
                "flat_model": "Improved",
                "lease_commence_date": 1980,
                "resale_price": 400000,
            },
            {
                "month": "2023-02",
                "town": "BEDOK",
                "flat_type": "4 ROOM",
                "block": "456",
                "street_name": "BEDOK NORTH AVE 1",
                "storey_range": "04 TO 06",
                "floor_area_sqm": 90.0,
                "flat_model": "Model A",
                "lease_commence_date": 1985,
                "resale_price": 520000,
            },
            {
                "month": "2023-03",
                "town": "DOWNTOWN CORE",
                "flat_type": "3 ROOM",
                "block": "789",
                "street_name": "CROSS STREET",
                "storey_range": "10 TO 12",
                "floor_area_sqm": 75.0,
                "flat_model": "Improved",
                "lease_commence_date": 1990,
                "resale_price": 650000,
            },
            {
                "month": "2023-03",
                "town": "JURONG EAST",
                "flat_type": "4 ROOM",
                "block": "124",
                "street_name": "JURONG EAST ST 12",
                "storey_range": "07 TO 09",
                "floor_area_sqm": 85.0,
                "flat_model": "New Generation",
                "lease_commence_date": 1982,
                "resale_price": 450000,
            },
        ]
    )

    # --- 2. Region towns (GeoJSON-normalised) ---
    # Small polygons around Singapore coordinates
    # JURONG EAST: centroid ~103.74, 1.33
    # BEDOK:        centroid ~103.93, 1.32
    # DOWNTOWN CORE: centroid ~103.85, 1.28
    region_towns = pd.DataFrame(
        [
            {
                "properties.PLN_AREA_N": "JURONG EAST",
                "properties.REGION_N": "WEST REGION",
                "geometry.type": "Polygon",
                "geometry.coordinates": [
                    [
                        [103.73, 1.32],
                        [103.75, 1.32],
                        [103.75, 1.34],
                        [103.73, 1.34],
                        [103.73, 1.32],
                    ]
                ],
            },
            {
                "properties.PLN_AREA_N": "BEDOK",
                "properties.REGION_N": "EAST REGION",
                "geometry.type": "Polygon",
                "geometry.coordinates": [
                    [
                        [103.92, 1.31],
                        [103.94, 1.31],
                        [103.94, 1.33],
                        [103.92, 1.33],
                        [103.92, 1.31],
                    ]
                ],
            },
            {
                "properties.PLN_AREA_N": "DOWNTOWN CORE",
                "properties.REGION_N": "CENTRAL REGION",
                "geometry.type": "Polygon",
                "geometry.coordinates": [
                    [
                        [103.84, 1.27],
                        [103.86, 1.27],
                        [103.86, 1.29],
                        [103.84, 1.29],
                        [103.84, 1.27],
                    ]
                ],
            },
        ]
    )

    # --- 3. Schools (CSV columns) ---
    # dgp_code must fuzzy-match a town key.
    # "JURONG EAST" -> key("JURONG EAST") = "JURONG EAST" (direct match)
    # "BEDOK" -> key("BEDOK") = "BEDOK" (direct match)
    schools = pd.DataFrame(
        [
            {
                "school_name": "Jurong East Primary School",
                "address": "10 Jurong East Ave 1",
                "postal_code": "609601",
                "dgp_code": "JURONG EAST",
            },
            {
                "school_name": "Bedok Green Secondary School",
                "address": "10 Bedok South Ave 2",
                "postal_code": "469201",
                "dgp_code": "BEDOK",
            },
        ]
    )

    # --- 4. Gyms (GeoJSON-normalised) ---
    # Point at centroid of JURONG EAST polygon: 103.74, 1.33
    # Description HTML with NAME, ADDRESSSTREETNAME, ADDRESSPOSTALCODE
    gyms = pd.DataFrame(
        [
            {
                "properties.NAME": "Jurong East Sports Centre",
                "properties.ADDRESSSTREETNAME": "21 Jurong East St 31",
                "properties.ADDRESSPOSTALCODE": "609517",
                "properties.Description": (
                    "<table>"
                    "<tr><th>NAME</th><td>Jurong East Sports Centre</td></tr>"
                    "<tr><th>ADDRESSSTREETNAME</th><td>21 Jurong East St 31</td></tr>"
                    "<tr><th>ADDRESSPOSTALCODE</th><td>609517</td></tr>"
                    "</table>"
                ),
                "geometry.type": "Point",
                "geometry.coordinates": [103.74, 1.33],
            },
        ]
    )

    # --- 5. Parks (GeoJSON-normalised) ---
    # Points at centroid of BEDOK polygon: 103.93, 1.32
    parks = pd.DataFrame(
        [
            {
                "properties.NAME": "Bedok Town Park",
                "properties.ADDRESSSTREETNAME": "10 Bedok South Road",
                "properties.ADDRESSPOSTALCODE": "469201",
                "properties.Description": (
                    "<table>"
                    "<tr><th>NAME</th><td>Bedok Town Park</td></tr>"
                    "<tr><th>ADDRESSSTREETNAME</th><td>10 Bedok South Road</td></tr>"
                    "<tr><th>ADDRESSPOSTALCODE</th><td>469201</td></tr>"
                    "</table>"
                ),
                "geometry.type": "Point",
                "geometry.coordinates": [103.93, 1.32],
            },
            {
                "properties.NAME": "Bedok Reservoir Park",
                "properties.ADDRESSSTREETNAME": "10 Bedok Reservoir Road",
                "properties.ADDRESSPOSTALCODE": "479301",
                "properties.Description": (
                    "<table>"
                    "<tr><th>NAME</th><td>Bedok Reservoir Park</td></tr>"
                    "<tr><th>ADDRESSSTREETNAME</th><td>10 Bedok Reservoir Road</td></tr>"
                    "<tr><th>ADDRESSPOSTALCODE</th><td>479301</td></tr>"
                    "</table>"
                ),
                "geometry.type": "Point",
                "geometry.coordinates": [103.93, 1.32],
            },
        ]
    )

    return {
        "resale_flat_prices": resale_flat_prices,
        "region_towns": region_towns,
        "schools": schools,
        "gyms": gyms,
        "parks": parks,
    }


def main():
    print("=" * 60)
    print("Synthetic E2E Smoke Test: Cleanroom ETL Pipeline")
    print("=" * 60)

    # Build synthetic data
    print("\n[1/5] Building synthetic raw datasets...")
    raw = build_synthetic_raw_datasets()
    for key, df in raw.items():
        print(f"  {key}: {len(df)} rows, columns={list(df.columns)}")

    # Transform
    print("\n[2/5] Running transform_all()...")
    result = transform_all(raw)
    print("  Transform OK.")
    print(f"  MariaDB frames: { {k: len(v) for k, v in result.mariadb.items()} }")
    print(f"  MongoDB frames: { {k: len(v) for k, v in result.mongodb.items()} }")

    # Connect to databases
    print("\n[3/5] Connecting to databases...")
    mdb = connect_mariadb()
    mconn = connect_mongodb()
    print("  Connections OK.")

    # Load to MariaDB
    print("\n[4/5] Loading to MariaDB...")
    try:
        id_maps = load_mariadb(result, mdb)
        print(f"  MariaDB load OK. id_maps keys: {list(id_maps.keys())}")
        for key, mapping in id_maps.items():
            print(f"    {key}: {len(mapping)} entries")
    except Exception as e:
        print(f"  MariaDB load FAILED: {e}")
        mdb.rollback()
        mdb.close()
        mconn.close()
        raise

    # Load to MongoDB
    print("\n[5/5] Loading to MongoDB...")
    try:
        load_mongodb(result, mconn, id_maps)
        print("  MongoDB load OK.")
    except Exception as e:
        print(f"  MongoDB load FAILED: {e}")
        mdb.rollback()
        mdb.close()
        mconn.close()
        raise

    # Cleanup
    mdb.close()
    mconn.close()

    print("\n" + "=" * 60)
    print("SMOKE TEST PASSED")
    print("=" * 60)


if __name__ == "__main__":
    main()
