from typing import Any

from .tests import (
    build_mariadb_operations,
    build_mongodb_operations,
    build_crossdb_operations,
    Operation,
)


def build_operations(context: dict[str, Any]) -> list[Operation]:
    return [
        *build_mariadb_operations(context),
        *build_mongodb_operations(context),
        *build_crossdb_operations(),
    ]
