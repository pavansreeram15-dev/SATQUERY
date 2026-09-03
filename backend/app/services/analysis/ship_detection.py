from ..local_processing_service import local_processing_service
from ...schemas.persona_schemas import QueryIntent, UserPersona

def detect_ships(bbox: list, persona: UserPersona = UserPersona.ISRO_ANALYST):
    return local_processing_service.execute_analysis(
        intent=QueryIntent.OBJECT_COUNT,
        target_classes=["cargo_ship", "vessel"],
        bbox=bbox,
        persona=persona
    )
