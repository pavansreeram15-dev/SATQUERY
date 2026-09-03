from typing import Optional
from fastapi import Header, HTTPException, status
from ..schemas.persona_schemas import UserPersona

async def get_current_persona(x_user_persona: Optional[str] = Header(None)) -> UserPersona:
    """Dependency to extract user persona from request headers or default to ISRO_ANALYST."""
    if not x_user_persona:
        return UserPersona.ISRO_ANALYST
    try:
        return UserPersona(x_user_persona)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid persona '{x_user_persona}'. Must be one of ISRO_ANALYST, NDRF_OFFICER, PUBLIC_RESEARCHER."
        )
