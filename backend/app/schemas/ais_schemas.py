from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class AISVessel(BaseModel):
    mmsi: str = Field(..., description="Unique Maritime Mobile Service Identity (MMSI)")
    imo: Optional[str] = Field(None, description="International Maritime Organization (IMO) number")
    name: str = Field(..., description="Vessel name")
    callsign: Optional[str] = Field(None, description="Radio call sign")
    latitude: float = Field(..., description="Latitude coordinate in WGS84")
    longitude: float = Field(..., description="Longitude coordinate in WGS84")
    speed_knots: float = Field(default=0.0, description="Speed Over Ground (SOG) in knots")
    course: float = Field(default=0.0, description="Course Over Ground (COG) in degrees")
    heading: float = Field(default=0.0, description="True heading in degrees")
    navigation_status: str = Field(default="Under Way", description="Navigation status (e.g. Under Way, At Anchor, Moored)")
    ship_type: str = Field(default="Cargo", description="Normalized ship category (e.g. Cargo, Tanker, Passenger, Fishing, Tug, Military, Pleasure, Other)")
    destination: Optional[str] = Field(None, description="Reported destination port")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp of last AIS message")
    source: str = Field(default="AISStream", description="Data provider source tag")
    last_update_seconds_ago: int = Field(default=0, description="Elapsed seconds since last position report")

class AISVesselFilter(BaseModel):
    ship_types: Optional[List[str]] = Field(default=None, description="List of allowed ship types")
    min_speed: Optional[float] = Field(default=None, description="Minimum speed in knots")
    max_speed: Optional[float] = Field(default=None, description="Maximum speed in knots")
    nav_status: Optional[str] = Field(default=None, description="Navigation status filter")
    search_query: Optional[str] = Field(default=None, description="Search term for MMSI, Name, or IMO")

class AISVesselSearchResult(BaseModel):
    vessels: List[AISVessel] = Field(default_factory=list)
    matched_count: int = 0
    search_query: str

class AISCorrelationMatch(BaseModel):
    matched: bool = False
    status_label: str = Field(default="No nearby AIS match", description="'Possible AIS-Satellite Match' or 'No nearby AIS match'")
    distance_km: Optional[float] = None
    time_diff_minutes: Optional[float] = None
    satellite_detection: Optional[Dict[str, Any]] = None
    matched_vessel: Optional[AISVessel] = None
    explanation: str = Field(default="", description="Detailed correlation rationale")

class AISStatusResponse(BaseModel):
    status: str = Field(..., description="Connection status: CONNECTING, CONNECTED, RECONNECTING, NO_DATA, ERROR, DISCONNECTED")
    vessel_count: int = 0
    last_update: Optional[str] = None
    active_bbox: Optional[List[float]] = None
    source: str = Field(default="AISStream.io WebSocket")
    message: Optional[str] = None
