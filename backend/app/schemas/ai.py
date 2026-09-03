from pydantic import BaseModel
from typing import Optional, Dict, Any

class AIBriefRequestSchema(BaseModel):
    query: str
    region_name: Optional[str] = "Survey Area"
    intent: Optional[str] = "GENERAL_GIS_VQA"
    metrics: Optional[Dict[str, Any]] = None
    weather_context: Optional[Dict[str, Any]] = None
    wiki_context: Optional[Dict[str, Any]] = None

class AIBriefResponseSchema(BaseModel):
    query: str
    region_name: str
    brief: str
