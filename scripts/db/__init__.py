from typing import Any

__all__ = ["Database", "MongoDB", "setup_mongodb"]


def __getattr__(name: str) -> Any:
    if name == "Database":
        from scripts.db.mariadb import Database

        return Database

    if name in {"MongoDB", "setup_mongodb"}:
        from scripts.db.mongodb import MongoDB, setup_mongodb

        return {"MongoDB": MongoDB, "setup_mongodb": setup_mongodb}[name]

    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
