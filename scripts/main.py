from scripts.db.mariadb import Database
from scripts.db.mongodb import setup_mongodb, MongoDB
from urllib.parse import quote_plus
import os
from scripts.extract import DataGovDatasetClient
import pandas as pd
from scripts.dataset_config import DATASETS
from scripts.dataset_transform import transform_datasets


def main():
    mongodb, mariadb = setup_db()
    client = DataGovDatasetClient(
        api_key=os.environ.get("DATAGOV_API_KEY", ""),
    )
    dataframes: dict[str, pd.DataFrame] = {}

    for config in DATASETS:
        dataframe = client.fetch_dataset(config)
        dataframes[config.key] = dataframe
    transformed_data = transform_datasets(dataframes)
    # Loading script goes here


def setup_db() -> tuple[MongoDB, Database]:
    mariadb = Database(
        host=os.environ.get("DB_HOST", "mariadb"),
        user=os.environ.get("DB_USER", "root"),
        password=os.environ.get("DB_PASSWORD", "P@ssw0rd"),
        database=os.environ.get("DB_NAME", "inf2003"),
    )
    mongodb = setup_mongodb(
        uri=os.environ.get(
            "MONGODB_URI",
            f"mongodb://root:{quote_plus('P@ssw0rd')}@mongo:27017/",
        ),
        database_name=os.environ.get("MONGODB_DATABASE", "test_db"),
    )
    return mongodb, mariadb


if __name__ == "__main__":
    main()
