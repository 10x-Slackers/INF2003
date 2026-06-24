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

MARIADB_HOST = os.environ.get("MARIADB_HOST", "mariadb")
MARIADB_PORT = int(os.environ.get("MARIADB_PORT", 3306))
MARIADB_DATABASE = os.environ.get("MARIADB_DATABASE", "inf2003")
MARIADB_USER = os.environ.get("MARIADB_USER", "root")
MARIADB_PASSWORD = os.environ.get("MARIADB_PASSWORD", "P@ssw0rd")

MONGO_HOST = os.environ.get("MONGO_HOST", "mongo")
MONGO_PORT = int(os.environ.get("MONGO_PORT", 27017))
MONGO_DATABASE = os.environ.get("MONGO_DATABASE", "inf2003")
MONGO_USER = os.environ.get("MONGO_USER", "root")
MONGO_PASSWORD = os.environ.get("MONGO_PASSWORD", "P@ssw0rd")


def run_extract(client: DataGovDatasetClient) -> dict:
    """Download every configured dataset."""
    raw_datasets = {}
    for config in DATASETS:
        print(f"[extract] {config.key}...", end=" ", flush=True)
        try:
            raw_datasets[config.key] = client.fetch_dataset(config)
            print(f"done ({len(raw_datasets[config.key])} rows)")
        except Exception as exc:
            print(f"FAILED: {exc}")
            raise
    return raw_datasets


def run_transform(raw_datasets: dict):
    """Run the transform step and print a short summary of each frame."""
    result = Transformer(raw_datasets, computed_at=datetime.now(UTC)).transform()

    print("[transform] SQL frames:")
    for name, frame in result.sql.items():
        print(f"  {name} done ({len(frame)} rows)")

    print("[transform] document frames:")
    for name, frame in result.documents.items():
        print(f"  {name} done ({len(frame)} rows)")

    return result


def run_load(db, mongo, result) -> None:
    """Load the transformed frames into MariaDB then MongoDB."""
    print("[load] MariaDB...", end=" ", flush=True)
    try:
        with MariaDBLoader(db) as loader:
            id_maps = loader.load(result)
        print("done")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    print("[load] MongoDB...", end=" ", flush=True)
    try:
        MongoDBLoader(mongo, id_maps).load(result)
        print("done")
    finally:
        mongo.close()


def main():
    client = DataGovDatasetClient(api_key=os.environ.get("DATAGOV_API_KEY"))
    raw_datasets = run_extract(client)
    result = run_transform(raw_datasets)

    db = connect_mariadb(
        host=MARIADB_HOST,
        port=MARIADB_PORT,
        user=MARIADB_USER,
        password=MARIADB_PASSWORD,
        db=MARIADB_DATABASE,
    )
    mongo = connect_mongodb(
        host=MONGO_HOST,
        port=MONGO_PORT,
        user=MONGO_USER,
        password=MONGO_PASSWORD,
        db=MONGO_DATABASE,
    )
    run_load(db, mongo, result)

    print("ETL complete!")


if __name__ == "__main__":
    main()
