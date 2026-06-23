from urllib.parse import quote_plus

import MySQLdb
from pymongo import MongoClient


def connect_mariadb(
    host: str = "mariadb",
    user: str = "root",
    password: str = "P@ssw0rd",
    db: str = "inf2003",
) -> "MySQLdb.Connection":
    """Open a MariaDB connection. Caller is responsible for commit/close."""
    return MySQLdb.connect(host=host, user=user, passwd=password, db=db)


def connect_mongodb(
    host: str = "mongo",
    port: int = 27017,
    user: str = "root",
    password: str = "P@ssw0rd",
    db: str = "inf2003",
) -> MongoClient:
    """Open a MongoDB client. Caller is responsible for close."""
    uri = (
        f"mongodb://{quote_plus(user)}:{quote_plus(password)}"
        f"@{host}:{port}/{db}?authSource=admin"
    )
    return MongoClient(uri)
