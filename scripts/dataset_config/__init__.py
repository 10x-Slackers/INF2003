from __future__ import annotations

from .gyms import DATASET as GYMS
from .parks import DATASET as PARKS
from .region_towns import DATASET as REGION_TOWNS
from .resale import DATASET as RESALE
from .schools import DATASET as SCHOOLS

DATASETS = (
    RESALE,
    SCHOOLS,
    GYMS,
    PARKS,
    REGION_TOWNS,
)
