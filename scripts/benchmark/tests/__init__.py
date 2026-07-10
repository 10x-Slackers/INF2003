from typing import Any

from .common import Operation, get_context, get_precompute_context
from .mariadb import (
    build_mariadb_operations,
    build_precompute_operation,
    run_maria_explain,
)


def build_operations(context: dict[str, Any]) -> list[Operation]:
    return build_mariadb_operations(context)


__all__ = [
    "build_operations",
    "build_mariadb_operations",
    "build_precompute_operation",
    "run_maria_explain",
    "Operation",
    "get_context",
    "get_precompute_context",
]
