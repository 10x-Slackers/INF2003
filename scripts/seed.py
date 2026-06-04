import sys

import requests

from scripts.db import Database
from scripts.datasets.region_town import (
    load_region_and_towns,
)

# DATASET_URL = "https://data.gov.sg/api/action/datastore_search?resource_id="
# RESALE_FLAT_PRICES = "d_8b84c4ee58e3cfc0ece0d773c8ca6abc"
# SCHOOLS_INFO = "d_688b934f82c1059ed0a6993d2a829089"
# GYMS_INFO = "d_b3ae090692ecf632116c9885cfbd3424"
# PARKS_INFO = "d_99b71f5d34cf57a3a592fbfdef1f42b6"
REGION_INFO = "https://api-open.data.gov.sg/v1/public/api/datasets/d_2cc750190544007400b2cfd5d7f53209/poll-download"


def extract_region_json(url: str) -> dict:
    """
    fetches the region and town data from API. The API returns a JSON object.

    Args:
        url (str): The URL to fetch the data from.

    Returns:
        dict: The JSON data as a dictionary.
    """
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    json_data = response.json()

    if json_data["code"] != 0:
        print(f"Error fetching data: {json_data.get('errorMsg')}")
        exit(1)

    download_url = json_data["data"]["url"]
    response = requests.get(download_url, timeout=60)
    response.raise_for_status()
    return response.json()


def seed() -> int:
    """
    Seeds the database with region and town data from the API into database tables.
    Returns:
        int: Success status code (0 for success, 1 for failure).
    """
    db = Database()
    connection = db.connect()

    try:
        with connection.cursor() as cursor:
            db.use_database(cursor)
            region_data = extract_region_json(REGION_INFO)
            region_count, towns_ids, town_code_ids = load_region_and_towns(
                cursor, db, region_data
            )

        connection.commit()
    except Exception as exc:
        connection.rollback()
        print(f"Seed operation failed: {exc}", file=sys.stderr)
        return 1
    finally:
        connection.close()

    print(f"Seeded {region_count} regions and {len(towns_ids)} towns.")
    return 0


def main() -> int:
    return seed()


if __name__ == "__main__":
    raise SystemExit(main())
