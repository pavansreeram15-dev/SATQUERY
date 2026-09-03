from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, field_validator
from .persona_schemas import UserPersona, QueryIntent, DataSourceType

class QueryRequest(BaseModel):
    prompt: str = Field(..., min_length=2, max_length=500, description="Natural language geospatial query")
    tile_id: Optional[str] = Field(None, description="Optional target satellite tile ID")
    viewport_bbox: Optional[List[float]] = Field(
        None, 
        description="Bounding box [min_lon, min_lat, max_lon, max_lat] in EPSG:4326"
    )
    aoi_geometry: Optional[Dict[str, Any]] = Field(None, description="Optional GeoJSON Polygon geometry")
    persona: UserPersona = Field(default=UserPersona.PUBLIC_RESEARCHER)
    before_year: Optional[int] = Field(None, ge=1970, le=2030)
    after_year: Optional[int] = Field(None, ge=1970, le=2030)
    target_classes: Optional[List[str]] = Field(default=None)

    @field_validator('viewport_bbox')
    @classmethod
    def validate_bbox(cls, v):
        if v is not None:
            if len(v) != 4:
                raise ValueError("BBOX must contain exactly 4 coordinates [min_lon, min_lat, max_lon, max_lat]")
            min_lon, min_lat, max_lon, max_lat = v
            if not (-180 <= min_lon <= 180 and -180 <= max_lon <= 180):
                raise ValueError("Longitude must be between -180 and 180")
            if not (-90 <= min_lat <= 90 and -90 <= max_lat <= 90):
                raise ValueError("Latitude must be between -90 and 90")
            if min_lon >= max_lon:
                raise ValueError("min_lon must be strictly less than max_lon")
            if min_lat >= max_lat:
                raise ValueError("min_lat must be strictly less than max_lat")
        return v

class ChangeDetectionRequest(BaseModel):
    region_name: str
    before_year: int = Field(default=2022)
    after_year: int = Field(default=2026)
    viewport_bbox: Optional[List[float]] = None
    persona: UserPersona = Field(default=UserPersona.ISRO_ANALYST)

class ComparisonRequest(BaseModel):
    viewport_bbox: List[float] = Field(..., description="[min_lon, min_lat, max_lon, max_lat]")
    before_date_or_year: Union[str, int] = Field(default=2023, description="Year (e.g. 2023) or ISO date (2023-06-15)")
    after_date_or_year: Union[str, int] = Field(default=2026, description="Year (e.g. 2026) or ISO date (2026-06-15)")
    sensor_type: str = Field(default="optical", description="'optical' (Sentinel-2), 'sar' (Sentinel-1), or 'landsat'")
    region_name: Optional[str] = None
    preset: Optional[str] = Field(default="CUSTOM", description="1H, 24H, 7D, 30D, 3M, 6M, 1Y, CUSTOM")

class LocationSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=200)
    limit: int = Field(default=5, ge=1, le=20)

class SatelliteSearchRequest(BaseModel):
    bbox: List[float] = Field(..., description="[min_lon, min_lat, max_lon, max_lat]")
    from_date: str = Field(default="2024-01-01")
    to_date: str = Field(default="2026-12-31")
    sensor_type: str = Field(default="optical", description="'optical', 'sar', or 'landsat'")
    max_cloud_cover: float = Field(default=30.0, ge=0.0, le=100.0)
    limit: int = Field(default=5, ge=1, le=20)
