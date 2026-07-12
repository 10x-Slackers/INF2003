import os
from typing import Any

import MySQLdb.cursors

from load import connect_mariadb as open_mariadb
from load import connect_mongodb as open_mongodb

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


def connect_mariadb():
    return open_mariadb(
        host=MARIADB_HOST,
        port=MARIADB_PORT,
        user=MARIADB_USER,
        password=MARIADB_PASSWORD,
        db=MARIADB_DATABASE,
    )


def connect_mongodb():
    return open_mongodb(
        host=MONGO_HOST,
        port=MONGO_PORT,
        user=MONGO_USER,
        password=MONGO_PASSWORD,
        db=MONGO_DATABASE,
    )


def mongo_db(client):
    return client[MONGO_DATABASE]


def query(conn, sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with conn.cursor(MySQLdb.cursors.DictCursor) as cursor:
        cursor.execute(sql, params)
        return list(cursor.fetchall())


def get_handler_read_rnd_next(conn) -> int:
    rows = query(conn, "SHOW SESSION STATUS LIKE 'Handler_read_rnd_next'")
    return int(rows[0]["Value"])
