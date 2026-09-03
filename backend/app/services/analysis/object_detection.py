from ..local_processing_service import local_processing_service
from ...schemas.persona_schemas import QueryIntent, UserPersona

def detect_objects(target_classes: list, bbox: list, persona: UserPersona = UserPersona.ISRO_ANALYST):
    return local_processing_service.execute_analysis(
        intent=QueryIntent.OBJECT_DETECTION,
        target_classes=target_classes,
        bbox=bbox,
        persona=persona
    )
