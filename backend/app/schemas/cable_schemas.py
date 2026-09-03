from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class CableProperties(BaseModel):
    id: str
    name: str
    color: Optional[str] = Field(default="#06b6d4")
    feature_id: Optional[str] = None
    owners: Optional[str] = None
    length: Optional[str] = None
    rfs: Optional[str] = None
    rfs_year: Optional[int] = None
    is_planned: Optional[bool] = False
    source: str = Field(default="Gigawatt Map / TeleGeography (CC BY-NC-SA 3.0)")

class SubmarineCableFeature(BaseModel):
    type: str = "Feature"
    properties: CableProperties
    geometry: Dict[str, Any] # LineString or MultiLineString

class SubmarineCableCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[SubmarineCableFeature] = Field(default_factory=list)
    total_count: int = 0
    bbox_filtered: bool = False
    attribution: str = Field(default="Data: Gigawatt Map / TeleGeography — CC BY-NC-SA 3.0, non-commercial use")

class LandingPointProperties(BaseModel):
    id: str
    name: str
    country: Optional[str] = None
    is_tbd: Optional[bool] = False
    source: str = Field(default="Gigawatt Map / TeleGeography (CC BY-NC-SA 3.0)")

class LandingPointFeature(BaseModel):
    type: str = "Feature"
    properties: LandingPointProperties
    geometry: Dict[str, Any] # Point

class LandingPointCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[LandingPointFeature] = Field(default_factory=list)
    total_count: int = 0
    bbox_filtered: bool = False
    attribution: str = Field(default="Data: Gigawatt Map / TeleGeography — CC BY-NC-SA 3.0, non-commercial use")

class SubmarineCableDetail(BaseModel):
    id: str
    name: str
    length: Optional[str] = None
    landing_points: List[Dict[str, Any]] = Field(default_factory=list)
    owners: Optional[str] = None
    suppliers: Optional[str] = None
    rfs: Optional[str] = None
    rfs_year: Optional[int] = None
    is_planned: Optional[bool] = False
    url: Optional[str] = None
    notes: Optional[str] = None
    attribution: str = Field(default="Data: Gigawatt Map / TeleGeography — CC BY-NC-SA 3.0, non-commercial use")
