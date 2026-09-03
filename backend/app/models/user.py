from pydantic import BaseModel, Field
from typing import Optional
from ..schemas.persona_schemas import UserPersona

class UserModel(BaseModel):
    id: str
    email: str
    persona: UserPersona = UserPersona.ISRO_ANALYST
    full_name: Optional[str] = None
    created_at: str
