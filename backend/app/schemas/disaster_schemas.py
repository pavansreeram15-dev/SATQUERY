from typing import List, Optional, Dict, Any, Union
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime

class DisasterType(str, Enum):
    EARTHQUAKE = "earthquake"
    WILDFIRE = "wildfire"
    CYCLONE = "cyclone"
    FLOOD = "flood"
    VOLCANO = "volcano"
    TSUNAMI = "tsunami"
    STORM = "storm"
    DROUGHT = "drought"
    OTHER = "other"

class DisasterSeverity(str, Enum):
    SMALL = "small"
    MODERATE = "moderate"
    MAJOR = "major"
    SEVERE = "severe"
    CRITICAL = "critical"

class DisasterAlertLevel(str, Enum):
    GREEN = "green"
    YELLOW = "yellow"
    ORANGE = "orange"
    RED = "red"
    WHITE = "white"

class EarthEvent(BaseModel):
    id: str = Field(..., description="Normalized global unique identifier, e.g. dis-usgs-us7000xxxx")
    source: str = Field(..., description="Primary provider: USGS, EONET, FIRMS, or GDACS")
    sources: List[str] = Field(default_factory=list, description="All reporting providers, e.g. ['USGS', 'GDACS']")
    source_event_id: Optional[str] = Field(None, description="Native event identifier from the upstream provider")
    
    type: DisasterType = Field(..., description="Standardized disaster category")
    title: str = Field(..., description="Descriptive event headline")
    description: Optional[str] = Field(None, description="Detailed situation summary or narrative")
    
    latitude: float = Field(..., description="WGS84 Latitude")
    longitude: float = Field(..., description="WGS84 Longitude")
    
    magnitude: Optional[float] = Field(None, description="Earthquake magnitude, wind speed, or energy index")
    depth_km: Optional[float] = Field(None, description="Earthquake hypocenter depth in km")
    
    severity: DisasterSeverity = Field(default=DisasterSeverity.MODERATE, description="Computed severity classification")
    alert_level: DisasterAlertLevel = Field(default=DisasterAlertLevel.GREEN, description="Formal warning alert level")
    confidence: Optional[float] = Field(None, description="Detection confidence (0.0 - 1.0) or percentage")
    
    start_time: Optional[str] = Field(None, description="ISO-8601 initial detection or occurrence timestamp")
    updated_time: Optional[str] = Field(None, description="ISO-8601 latest telemetry update timestamp")
    end_time: Optional[str] = Field(None, description="ISO-8601 event resolution or expiration timestamp")
    
    country: Optional[str] = Field(None, description="ISO or common country name")
    region: Optional[str] = Field(None, description="Administrative state, province, or geographic basin")
    
    source_url: Optional[str] = Field(None, description="Official external report or USGS/EONET/GDACS web URL")
    geometry: Optional[Dict[str, Any]] = Field(None, description="GeoJSON Geometry object (Point, Polygon, MultiPolygon)")
    raw_source: Optional[Dict[str, Any]] = Field(None, description="Provider-specific raw telemetry attributes")

class DisasterGeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: str
    geometry: Dict[str, Any]
    properties: Dict[str, Any]

class DisasterFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[DisasterGeoJSONFeature] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class DisasterProviderHealth(BaseModel):
    provider_name: str
    status: str  # "OPERATIONAL", "DEGRADED", "UNAVAILABLE", "UNCONFIGURED"
    last_poll_time: Optional[str] = None
    event_count: int = 0
    poll_interval_seconds: int = 60
    requires_api_key: bool = False
    is_authenticated: bool = True
    error_message: Optional[str] = None

class DisasterSummaryResponse(BaseModel):
    total_active_events: int
    by_type: Dict[str, int]
    by_severity: Dict[str, int]
    providers: List[DisasterProviderHealth]
    last_updated: str
