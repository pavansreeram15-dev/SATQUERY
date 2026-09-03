from typing import Dict, Any
from ..schemas.persona_schemas import UserPersona, QueryIntent
from ..services.permission_service import check_permission, get_persona_info

def verify_persona_permission(
    persona: UserPersona,
    intent: QueryIntent,
    target_classes: list = None
) -> Dict[str, Any]:
    """Verify role-based access clearance for execution pipeline."""
    return check_permission(persona, intent, target_classes)
