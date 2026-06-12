import MySQLdb
import pandas as pd

from scripts.db.schema import init_tables, teardown_tables


class Database:
    def __init__(self) -> None:
        self.connection = MySQLdb.connect(
            host="mariadb", user="root", password="P@ssw0rd", database="inf2003"
        )
        self.cursor = self.connection.cursor()

    def __enter__(self) -> "Database":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()

    def insert_dataframe(
        self, table_name: str, df: pd.DataFrame
    ) -> dict[str, str] | None:
        """
        Inserts a DataFrame into the specified table in the database.
        """
        if df.empty:
            return {}

        columns = self._insert_columns(df)
        sql = self._insert_sql(table_name, columns)
        rows = self._rows(df, columns)

        self.cursor.executemany(sql, rows)
        self.commit()
        return None

    def insert_dataframe_with_id(
        self, table_name: str, df: pd.DataFrame
    ) -> dict[str, str]:
        """
        Inserts a DataFrame and returns a map of source IDs to generated database IDs.
        """
        if "id" not in df.columns:
            raise ValueError("DataFrame must include an 'id' column")

        if df.empty:
            return {}

        columns = self._insert_columns(df)
        sql = self._insert_sql(table_name, columns, returning_id=True)
        data = self._clean_dataframe(df.sort_values("id").reset_index(drop=True))
        id_map = {}
        for record in data.to_dict(orient="records"):
            source_id = str(record.pop("id"))
            row = tuple(record[column] for column in columns)
            self.cursor.execute(sql, row)
            result = self.cursor.fetchone()
            if result is None:
                raise RuntimeError(f"No ID returned when inserting into {table_name}")
            id_map[source_id] = str(result[0])

        self.commit()
        return id_map

    def rollback(self) -> None:
        self.connection.rollback()

    def close(self) -> None:
        self.cursor.close()
        self.connection.close()

    def create_tables(self) -> None:
        init_tables(self.cursor)
        self.commit()

    def reset_tables(self) -> None:
        teardown_tables(self.cursor)
        init_tables(self.cursor)
        self.commit()

    def commit(self) -> None:
        self.connection.commit()

    @classmethod
    def _insert_columns(cls, df: pd.DataFrame) -> list[str]:
        columns = df.columns.drop("id", errors="ignore").tolist()
        if not columns:
            raise ValueError("DataFrame must include at least one insert column")
        return columns

    @classmethod
    def _insert_sql(
        cls, table_name: str, columns: list[str], *, returning_id: bool = False
    ) -> str:
        column_names = ", ".join(columns)
        placeholders = ", ".join(["%s"] * len(columns))
        returning_clause = " RETURNING id" if returning_id else ""
        return (
            f"INSERT INTO {table_name} ({column_names}) "
            f"VALUES ({placeholders}){returning_clause}"
        )

    @staticmethod
    def _clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
        return df.astype(object).where(pd.notna(df), None)

    @classmethod
    def _rows(cls, df: pd.DataFrame, columns: list[str]) -> list[tuple[object, ...]]:
        clean_df = cls._clean_dataframe(df.loc[:, columns])
        return list(clean_df.itertuples(index=False, name=None))


def main():
    db = Database()
    try:
        db.reset_tables()
        amenity_types_df = pd.DataFrame(
            {
                "id": ["GYM", "PARK", "SCHOOL"],
                "name": [
                    "gym",
                    "park",
                    "school",
                ],
            }
        )
        towns_df = pd.DataFrame(
            {
                "id": ["AMK"],
                "region": ["NORTH-EAST REGION"],
                "name": ["AMK"],
            }
        )
        amenities_df = pd.DataFrame(
            {
                "town_id": ["AMK", "AMK", "AMK"],
                "amenity_type_id": ["GYM", "PARK", "SCHOOL"],
                "name": [
                    "Gym",
                    "Park",
                    "School",
                ],
                "street_name": ["Street A", "Street B", "Street C"],
                "postal_code": ["123456", "123456", "123456"],
                "longitude": [103.8198, 103.8198, 103.8198],
                "latitude": [1.3521, 1.3521, 1.3521],
            }
        )

        amenity_type_id_map = db.insert_dataframe_with_id(
            "amenity_types", amenity_types_df
        )
        town_id_map = db.insert_dataframe_with_id("towns", towns_df)

        amenities_df["town_id"] = amenities_df["town_id"].map(town_id_map)
        amenities_df["amenity_type_id"] = amenities_df["amenity_type_id"].map(
            amenity_type_id_map
        )
        db.insert_dataframe("amenities", amenities_df)

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
