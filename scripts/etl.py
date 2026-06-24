import argparse
import os
from datetime import UTC, datetime

from extract import DATASETS, DataGovDatasetClient
from transform import Transformer
from load import (
    MariaDBLoader,
    MongoDBLoader,
    connect_mariadb,
    connect_mongodb,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the ETL pipeline.")
    parser.add_argument(
        "--api-key",
        help="data.gov.sg API key",
    )
    return parser.parse_args()


def run_extract(client: DataGovDatasetClient) -> dict:
    """Download every configured dataset."""
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
    result = Transformer(raw_datasets, computed_at=datetime.now(UTC)).transform()

    print("[transform] SQL frames:", flush=True)
    for name, frame in result.sql.items():
        print(f"  {name:<22} {len(frame)} rows", flush=True)

    print("[transform] document frames:", flush=True)
    for name, frame in result.documents.items():
        print(f"  {name:<22} {len(frame)} rows", flush=True)

    return result


def run_load(result) -> None:
    """Load the transformed frames into MariaDB then MongoDB."""
    mariadb_host = os.environ.get("MARIADB_HOST", "mariadb")
    mongo_host = os.environ.get("MONGO_HOST", "mongo")

    print("[load] MariaDB...", flush=True)
    db = connect_mariadb(host=mariadb_host)
    try:
        loader = MariaDBLoader(db)
        id_maps = loader.load(result)
        print("[load] MariaDB done", flush=True)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    print("[load] MongoDB...", flush=True)
    mongo = connect_mongodb(host=mongo_host)
    try:
        MongoDBLoader(mongo, id_maps).load(result)
        print("[load] MongoDB done", flush=True)
    finally:
        mongo.close()


def main():
    args = parse_args()
    client = DataGovDatasetClient(api_key=args.api_key)

    raw_datasets = run_extract(client)
    result = run_transform(raw_datasets)
    run_load(result)

    print("ETL complete!")


if __name__ == "__main__":
    main()
