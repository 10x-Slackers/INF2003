import os
from typing import Any, Mapping
from urllib.parse import quote_plus
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import CollectionInvalid, OperationFailure


from scripts.db.mongodb_schema import (
    MONGODB_COLLECTION_INDEXES,
    MONGODB_COLLECTION_VALIDATORS,
)

DEFAULT_MONGODB_URI = f"mongodb://root:{quote_plus('P@ssw0rd')}@mongo:27017/"

DEFAULT_DATABASE_NAME = os.getenv("MONGODB_DATABASE", "mongo")


class MongoDB:
    def __init__(
        self,
        uri: str = DEFAULT_MONGODB_URI,
        database_name: str = DEFAULT_DATABASE_NAME,
        *,
        validation_action: str = "error",
        server_selection_timeout_ms: int = 5000,
    ) -> None:
        self.uri = uri
        self.database_name = database_name
        self.validation_action = validation_action
        self.server_selection_timeout_ms = server_selection_timeout_ms
        self.client: MongoClient = self.get_client()
        self.database: Database = self.connect()
        self.setup()

    def get_client(self) -> MongoClient:
        return MongoClient(
            self.uri,
            serverSelectionTimeoutMS=self.server_selection_timeout_ms,
        )

    def connect(self) -> Database:
        self.client.admin.command("ping")
        return self.client[self.database_name]

    def ensure_collection(
        self,
        name: str,
        validator: Mapping[str, Any],
    ) -> None:
        try:
            self.database.create_collection(
                name,
                validator=dict(validator),
                validationAction=self.validation_action,
            )
        except CollectionInvalid:
            try:
                self.database.command(
                    "collMod",
                    name,
                    validator=dict(validator),
                    validationAction=self.validation_action,
                )
            except OperationFailure as e:
                raise RuntimeError(
                    f"Failed to create/modify collection '{name}': {e}"
                ) from e

    def ensure_indexes(self, collection_name: str) -> None:
        collection = self.database[collection_name]
        for index_name, keys in MONGODB_COLLECTION_INDEXES.get(collection_name, []):
            collection.create_index(keys, name=index_name)

    def setup(self) -> Database:
        """Create/update MongoDB validators and indexes, then return the database."""
        for collection_name, validator in MONGODB_COLLECTION_VALIDATORS.items():
            self.ensure_collection(collection_name, validator)
            self.ensure_indexes(collection_name)

        return self.database

    def __enter__(self) -> "MongoDB":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()

    def close(self) -> None:
        if self.client is not None:
            self.client.close()


def setup_mongodb(
    uri: str = DEFAULT_MONGODB_URI,
    database_name: str = DEFAULT_DATABASE_NAME,
    *,
    validation_action: str = "error",
    server_selection_timeout_ms: int = 5000,
) -> MongoDB:
    return MongoDB(
        uri=uri,
        database_name=database_name,
        validation_action=validation_action,
        server_selection_timeout_ms=server_selection_timeout_ms,
    )
