from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from .persona_schemas import UserPersona, QueryIntent, DataSourceType

class GeoJSONGeometry(BaseModel):
    type: str
    coordinates: Any

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: Optional[str] = None
    geometry: GeoJSONGeometry
    properties: Dict[str, Any] = Field(default_factory=dict)

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature] = Field(default_factory=list)

class QueryResponse(BaseModel):
    success: bool = True
    query: str = Field(..., description="User input natural language query")
    query_id: str
    prompt: str # for backwards compatibility with existing UI components
    persona: UserPersona
    intent: QueryIntent
    target_classes: List[str] = Field(default_factory=list)
    data_source: str
    execution_mode: str = Field(default="LOCAL", description="LIVE, FALLBACK, LOCAL, or DEMO")
    fallback_reason: Optional[str] = None
    dataset: str = Field(default="", description="Dataset name used")
    dataset_name: str = Field(default="", description="Dataset name for backwards compatibility")
    is_real_service: bool = False
    status: str = Field(default="NORMAL", description="NORMAL, WATCH, HIGH_RISK, CRITICAL, EMERGENCY_EVACUATION, INSUFFICIENT_DATA, DEMO")
    severity: str = Field(default="NONE", description="NONE, LOW, MODERATE, HIGH, CRITICAL")
    evidence: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Validated analysis evidence telemetry")
    evidence_breakdown: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Satellite evidence, weather evidence, and temporal evidence")
    weather_context: Optional[Dict[str, Any]] = Field(default=None, description="Open-Meteo meteorological telemetry")
    why_this_result: Optional[str] = Field(default=None, description="Scientific explanation of why this specific classification/result was produced")
    limitations: Optional[str] = Field(default=None, description="Known physical/sensor limitations e.g. cloud cover, revisit latency")
    analysis_type: Optional[str] = None
    is_demo: bool = Field(default=False, description="True if result is from a simulation or demo mode")
    aoi: Dict[str, Any] = Field(default_factory=dict)
    date_range: Dict[str, Any] = Field(default_factory=dict)
    analysis: Dict[str, Any] = Field(default_factory=dict)
    statistics: Dict[str, Any] = Field(default_factory=dict)
    summary_text: str
    count_metric: Optional[int] = None
    average_confidence: Optional[float] = None
    confidence: Optional[float] = None
    geojson: Optional[GeoJSONFeatureCollection] = None
    geojson_data: GeoJSONFeatureCollection = Field(default_factory=GeoJSONFeatureCollection)
    metrics: Dict[str, Any] = Field(default_factory=dict)
    comparison_data: Optional[Dict[str, Any]] = Field(default=None, description="Multi-temporal before/after delta comparison")
    processing_time_ms: int
    execution_pipeline: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str
    audit_id: str
    created_at: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: str = Field(..., description="Error code e.g. PERMISSION_DENIED, INVALID_QUERY, etc.")
    message: str = Field(..., description="Human-readable explanation of error")
    persona: Optional[str] = None
    required_permission: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class AuditLogItem(BaseModel):
    id: str
    timestamp: str
    user_persona: UserPersona
    action: str
    data_source: str
    status: str
    user_prompt: str
    execution_time_ms: int
    summary: Optional[str] = None

class TileInfo(BaseModel):
    id: str
    tile_code: str
    title: str
    region_name: str
    description: str
    capture_date: str
    satellite_name: str
    sensor_name: str
    resolution_meters: float
    bbox: List[float]
    center_lat: float
    center_lon: float
    cloud_cover_percentage: float
    data_source_tag: str = Field(default="DEMO DATA", description="LIVE or DEMO DATA tag")
    is_demo: bool = True
    metadata: Dict[str, Any] = Field(default_factory=dict)

class AnalyticsSummaryResponse(BaseModel):
    total_queries: int
    total_detections: int
    average_confidence: float
    average_processing_time_ms: int
    most_requested_intent: str
    intent_distribution: Dict[str, int]
    data_source_distribution: Dict[str, int]
    persona_usage: Dict[str, int]
    recent_activity_trend: List[Dict[str, Any]]
    confidence_distribution: List[Dict[str, Any]]

class ServiceStatus(BaseModel):
    service_name: str
    status: str # "OPERATIONAL", "CONFIGURED", "AVAILABLE_LOCAL_FALLBACK", "UNAVAILABLE"
    is_authenticated: bool
    description: str
    capabilities: List[str]

class LocationSearchResult(BaseModel):
    place_id: str
    display_name: str
    lat: float
    lon: float
    type: str
    bbox: List[float]
    importance: float
    provider: str

class ProviderHealthItem(BaseModel):
    provider_name: str
    display_name: str
    status: str
    auth_type: str
    is_configured: bool
    last_checked: str
    latency_ms: int
