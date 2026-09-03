from typing import List, Optional
from pydantic import BaseModel, Field

class MaritimePortSchema(BaseModel):
    id: str = Field(..., description="Unique port identifier")
    name: str = Field(..., description="Port / terminal name")
    code: str = Field(..., description="UN/LOCODE or port code")
    category: str = Field(..., description="Port category: Deepwater Port, Container Terminal, etc.")
    country: str = Field(..., description="Country")
    latitude: float = Field(..., description="WGS84 latitude")
    longitude: float = Field(..., description="WGS84 longitude")
    berth_count: int = Field(..., description="Number of operational berths")
    annual_traffic_teu: str = Field(..., description="Annual TEU container throughput")
    status: str = Field(..., description="Operational status")
    ais_vessels_detected: int = Field(default=0, description="Active vessels in harbor vicinity")
    description: str = Field(..., description="Port description and capabilities")

class MaritimeGeoJSONGeometry(BaseModel):
    type: str = "Point"
    coordinates: List[float] = Field(..., description="[longitude, latitude]")

class MaritimeGeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: str
    geometry: MaritimeGeoJSONGeometry
    properties: MaritimePortSchema

class MaritimeFeatureCollectionSchema(BaseModel):
    type: str = "FeatureCollection"
    features: List[MaritimeGeoJSONFeature]
    metadata: dict

class MaritimeSearchResponse(BaseModel):
    success: bool = True
    total: int
    ports: List[MaritimePortSchema]
