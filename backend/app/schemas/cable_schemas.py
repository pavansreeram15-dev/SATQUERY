from typing import List, Optional, Any, Union
from pydantic import BaseModel, Field

class SubmarineCableProperties(BaseModel):
    id: str
    name: str
    color: str = "#06b6d4"
    feature_id: Optional[str] = None
    length_km: Optional[float] = None
    rfs_year: Optional[int] = None
    owners: Optional[List[str]] = Field(default_factory=list)
    capacity_tbps: Optional[float] = None
    landing_points_count: Optional[int] = None
    url: Optional[str] = None
    is_planned: Optional[bool] = False

class SubmarineCableGeometry(BaseModel):
    type: str = "LineString"
    coordinates: Union[List[List[float]], List[List[List[float]]]]

class SubmarineCableFeature(BaseModel):
    type: str = "Feature"
    id: str
    geometry: SubmarineCableGeometry
    properties: SubmarineCableProperties

class SubmarineCablesResponse(BaseModel):
    type: str = "FeatureCollection"
    features: List[SubmarineCableFeature]
    metadata: Optional[dict] = None

class LandingPointProperties(BaseModel):
    id: str
    name: str
    country: str
    latitude: float
    longitude: float
    cables_count: int = 1
    cable_names: Optional[List[str]] = Field(default_factory=list)

class LandingPointGeometry(BaseModel):
    type: str = "Point"
    coordinates: List[float]

class LandingPointFeature(BaseModel):
    type: str = "Feature"
    id: str
    geometry: LandingPointGeometry
    properties: LandingPointProperties

class LandingPointsResponse(BaseModel):
    type: str = "FeatureCollection"
    features: List[LandingPointFeature]
    metadata: Optional[dict] = None

class CableDetailResponse(BaseModel):
    success: bool = True
    cable: SubmarineCableProperties
    landing_points: Optional[List[LandingPointProperties]] = Field(default_factory=list)
    suppliers: Optional[List[str]] = Field(default_factory=list)
    notes: Optional[str] = None
