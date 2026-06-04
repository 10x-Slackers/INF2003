from dataclasses import dataclass


@dataclass(frozen=True)
class Region:
    region_name: str
    region_code: str

    def db_values(self) -> dict[str, str]:
        return {
            "region_name": self.region_name,
            "region_code": self.region_code,
        }


@dataclass(frozen=True)
class Town:
    town_name: str
    town_code: str
    region_code: str

    def db_values(self, region_id: int) -> dict[str, str | int]:
        return {
            "town_name": self.town_name,
            "town_code": self.town_code,
            "region_id": region_id,
        }


@dataclass(frozen=True)
class RegionTown:
    region: Region
    town: Town

    def to_record(self) -> dict[str, str]:
        return {
            "region_name": self.region.region_name,
            "region_code": self.region.region_code,
            "town_name": self.town.town_name,
            "town_code": self.town.town_code,
        }
