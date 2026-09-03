from pydantic import BaseModel
from typing import Dict, Any, Optional

class ReportRequestSchema(BaseModel):
    query_id: str
    format: str = "pdf"
    include_map: bool = True

class ReportResponseSchema(BaseModel):
    report_id: str
    url: Optional[str] = None
    data: Dict[str, Any]
