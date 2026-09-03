from pydantic import BaseModel
from typing import Optional

class SessionModel(BaseModel):
    session_id: str
    user_id: str
    persona: str
    active: bool = True
    created_at: str
