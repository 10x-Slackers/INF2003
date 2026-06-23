#!/usr/bin/env python3
"""ETL orchestrator.

Runs the three ETL steps in order against the data.gov.sg datasets:
    1. extract: download raw datasets as DataFrames
    2. transform: clean, normalise, and shape them for MariaDB + MongoDB
    3. load: insert the shaped frames into both databases
"""

import argparse
import os
import sys
from datetime import UTC, datetime

from extract import DATASETS, DataGovDatasetClient
from transform import transform_all
from load import connect_mariadb, connect_mongodb, load_mariadb, load_mongodb


def run_extract(client: DataGovDatasetClient) -> dict:
    """Download every configured dataset and return {key: DataFrame}."""
    raw_datasets = {}
    for config in DATASETS:
        print(f"[extract] {config.key} ...", flush=True)
        raw_datasets[config.key] = client.fetch_dataset(config)
        print(
            f"[extract] {config.key} -> {len(raw_datasets[config.key])} rows",
            flush=True,
        )
    return raw_datasets


def run_transform(raw_datasets: dict):
    """Run the transform step and print a short summary of each frame."""
    result = transform_all(raw_datasets, computed_at=datetime.now(UTC))

    print("[transform] MariaDB frames:", flush=True)
    for name, frame in result.mariadb.items():
        print(f"  {name:<22} {len(frame)} rows", flush=True)

    print("[transform] MongoDB frames:", flush=True)
    for name, frame in result.mongodb.items():
        print(f"  {name:<22} {len(frame)} rows", flush=True)

    return result


def run_load(result) -> None:
    """Load the transformed frames into MariaDB then MongoDB."""
    mariadb_host = os.environ.get("MARIADB_HOST", "mariadb")
    mongo_host = os.environ.get("MONGO_HOST", "mongo")

    print("[load] MariaDB ...", flush=True)
    db = connect_mariadb(host=mariadb_host)
    try:
        id_maps = load_mariadb(result, db)
        print("[load] MariaDB done", flush=True)
    except Exception:
        db.rollback()
        db.close()
        raise

    print("[load] MongoDB ...", flush=True)
    mongo = connect_mongodb(host=mongo_host)
    try:
        load_mongodb(result, mongo, id_maps)
        print("[load] MongoDB done", flush=True)
    finally:
        db.close()
        mongo.close()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Run the INF2003 ETL pipeline (extract -> transform -> load).",
    )
    parser.parse_args(argv)

    client = DataGovDatasetClient()

    raw_datasets = run_extract(client)
    result = run_transform(raw_datasets)
    run_load(result)

    print("[etl] complete", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
