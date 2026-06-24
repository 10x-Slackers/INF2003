from urllib.parse import quote_plus

import MySQLdb
from pymongo import MongoClient
from MySQLdb import Connection


def connect_mariadb(
    host: str,
    port: int,
    user: str,
    password: str,
    db: str,
) -> Connection:
    """Open a MariaDB connection. Caller is responsible for commit/close."""
    return MySQLdb.connect(
        host=host, port=port, user=user, passwd=password, db=db, connect_timeout=5
    )


def connect_mongodb(
    host: str,
    port: int,
    user: str,
    password: str,
    db: str,
) -> MongoClient:
    """Open a MongoDB client. Caller is responsible for close."""
    uri = f"mongodb://{quote_plus(user)}:{quote_plus(password)}@{host}:{port}/{db}?authSource=admin"
    return MongoClient(uri, serverSelectionTimeoutMS=5000)
