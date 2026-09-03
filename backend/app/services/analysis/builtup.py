from ..local_processing_service import local_processing_service
from ...schemas.persona_schemas import QueryIntent, UserPersona

def analyze_builtup_area(bbox: list, persona: UserPersona = UserPersona.PUBLIC_RESEARCHER):
    return local_processing_service.execute_analysis(
        intent=QueryIntent.SEGMENT_TERRAIN,
        target_classes=["urban", "infrastructure"],
        bbox=bbox,
        persona=persona
    )
