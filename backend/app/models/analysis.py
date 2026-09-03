from pydantic import BaseModel
from typing import Dict, Any, List, Optional

class AnalysisModel(BaseModel):
    query_id: str
    prompt: str
    intent: str
    persona: str
    data_source: str
    status: str
    metrics: Dict[str, Any]
    created_at: str
