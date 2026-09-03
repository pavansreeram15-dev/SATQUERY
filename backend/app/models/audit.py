from pydantic import BaseModel
from typing import Optional

class AuditModel(BaseModel):
    audit_id: str
    user_persona: str
    action: str
    data_source: str
    status: str
    execution_time_ms: int
    user_prompt: str
    summary: Optional[str] = None
    created_at: str
