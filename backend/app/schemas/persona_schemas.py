from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class UserPersona(str, Enum):
    ISRO_ANALYST = "ISRO_ANALYST"
    NDRF_OFFICER = "NDRF_OFFICER"
    PUBLIC_RESEARCHER = "PUBLIC_RESEARCHER"

class QueryIntent(str, Enum):
    OBJECT_COUNT = "OBJECT_COUNT"
    OBJECT_DETECTION = "OBJECT_DETECTION"
    SEGMENT_TERRAIN = "SEGMENT_TERRAIN"
    FLOOD_DETECTION = "FLOOD_DETECTION"
    CHANGE_DETECTION = "CHANGE_DETECTION"
    SPECTRAL_ANALYSIS = "SPECTRAL_ANALYSIS"
    NDVI_ANALYSIS = "NDVI_ANALYSIS"
    NDWI_ANALYSIS = "NDWI_ANALYSIS"
    GENERAL_GIS_VQA = "GENERAL_GIS_VQA"

class DataSourceType(str, Enum):
    SENTINEL_HUB = "SENTINEL_HUB"
    GOOGLE_EARTH_ENGINE = "GOOGLE_EARTH_ENGINE"
    ISRO_BHUVAN = "ISRO_BHUVAN"
    LOCAL_PROCESSING = "LOCAL_PROCESSING"

class PersonaPermissions(BaseModel):
    can_detect_infrastructure: bool
    can_access_sar: bool
    can_view_emergency_layers: bool
    can_run_change_detection: bool
    can_run_spectral: bool
    can_export_operational_reports: bool
    can_export_geotiff: bool
    max_export_level: str = Field(description="PUBLIC or OPERATIONAL")

class PersonaInfo(BaseModel):
    id: UserPersona
    name: str
    short_name: str
    icon: str
    description: str
    permissions: PersonaPermissions
    preferred_layers: List[str]
    preferred_analyses: List[QueryIntent]
