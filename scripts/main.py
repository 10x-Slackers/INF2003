from scripts.db.mariadb import Database
from scripts.db.mongodb import setup_mongodb
from urllib.parse import quote_plus
import os


def main():
    test_db_connection()


def test_db_connection():
    try:
        db = Database(
            host=os.environ.get("DB_HOST", "mariadb"),
            user=os.environ.get("DB_USER", "root"),
            password=os.environ.get("DB_PASSWORD", "P@ssw0rd"),
            database=os.environ.get("DB_NAME", "inf2003"),
        )
        print("MariaDB connection successful.")
        db.close()
    except Exception as e:
        print(f"An error occurred: {e}")
    try:
        mongodb = setup_mongodb(
            uri=os.environ.get(
                "MONGODB_URI",
                f"mongodb://root:{quote_plus('P@ssw0rd')}@mongo:27017/",
            ),
            database_name=os.environ.get("MONGODB_DATABASE", "test_db"),
        )
        print("MongoDB connection successful.")
        mongodb.close()
    except Exception as e:
        print(f"An error occurred while connecting to MongoDB: {e}")


if __name__ == "__main__":
    main()
