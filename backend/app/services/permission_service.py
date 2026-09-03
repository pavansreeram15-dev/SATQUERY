from typing import Dict, List, Any, Optional
from ..schemas.persona_schemas import UserPersona, PersonaPermissions, PersonaInfo, QueryIntent

PERSONA_REGISTRY: Dict[UserPersona, PersonaInfo] = {
    UserPersona.ISRO_ANALYST: PersonaInfo(
        id=UserPersona.ISRO_ANALYST,
        name="ISRO / SPACE ANALYST",
        short_name="ISRO Analyst",
        icon="Satellite",
        description="Full multi-spectral, SAR, optical infrastructure detection, temporal change, and advanced GIS analysis.",
        permissions=PersonaPermissions(
            can_detect_infrastructure=True,
            can_access_sar=True,
            can_view_emergency_layers=True,
            can_run_change_detection=True,
            can_run_spectral=True,
            can_export_operational_reports=True,
            can_export_geotiff=True,
            max_export_level="OPERATIONAL"
        ),
        preferred_layers=["satellite", "sentinel2", "detections", "change", "ndvi", "bhuvan_lulc"],
        preferred_analyses=[
            QueryIntent.OBJECT_COUNT,
            QueryIntent.OBJECT_DETECTION,
            QueryIntent.CHANGE_DETECTION,
            QueryIntent.SPECTRAL_ANALYSIS,
            QueryIntent.NDVI_ANALYSIS,
            QueryIntent.NDWI_ANALYSIS,
            QueryIntent.FLOOD_DETECTION,
            QueryIntent.SEGMENT_TERRAIN,
            QueryIntent.GENERAL_GIS_VQA
        ]
    ),
    UserPersona.NDRF_OFFICER: PersonaInfo(
        id=UserPersona.NDRF_OFFICER,
        name="NDRF / DISASTER OFFICER",
        short_name="NDRF Officer",
        icon="ShieldAlert",
        description="Rapid disaster response, flood inundation modeling, water extent tracking, and emergency impact summaries.",
        permissions=PersonaPermissions(
            can_detect_infrastructure=False,
            can_access_sar=True,
            can_view_emergency_layers=True,
            can_run_change_detection=True,
            can_run_spectral=True,
            can_export_operational_reports=True,
            can_export_geotiff=False,
            max_export_level="OPERATIONAL"
        ),
        preferred_layers=["satellite", "flood", "ndwi", "change", "bhuvan_flood"],
        preferred_analyses=[
            QueryIntent.FLOOD_DETECTION,
            QueryIntent.NDWI_ANALYSIS,
            QueryIntent.CHANGE_DETECTION,
            QueryIntent.SEGMENT_TERRAIN,
            QueryIntent.OBJECT_COUNT,
            QueryIntent.NDVI_ANALYSIS,
            QueryIntent.SPECTRAL_ANALYSIS,
            QueryIntent.GENERAL_GIS_VQA
        ]
    ),
    UserPersona.PUBLIC_RESEARCHER: PersonaInfo(
        id=UserPersona.PUBLIC_RESEARCHER,
        name="PUBLIC / RESEARCH USER",
        short_name="Public Researcher",
        icon="GraduationCap",
        description="Public open-access Sentinel-2 optical imagery, vegetation health (NDVI), water index (NDWI), and open GIS research.",
        permissions=PersonaPermissions(
            can_detect_infrastructure=False,
            can_access_sar=False,
            can_view_emergency_layers=False,
            can_run_change_detection=True,
            can_run_spectral=True,
            can_export_operational_reports=False,
            can_export_geotiff=False,
            max_export_level="PUBLIC"
        ),
        preferred_layers=["satellite", "sentinel2", "ndvi", "ndwi"],
        preferred_analyses=[
            QueryIntent.NDVI_ANALYSIS,
            QueryIntent.NDWI_ANALYSIS,
            QueryIntent.SEGMENT_TERRAIN,
            QueryIntent.OBJECT_COUNT,
            QueryIntent.CHANGE_DETECTION,
            QueryIntent.GENERAL_GIS_VQA
        ]
    )
}

def get_persona_info(persona: UserPersona) -> PersonaInfo:
    return PERSONA_REGISTRY.get(persona, PERSONA_REGISTRY[UserPersona.PUBLIC_RESEARCHER])

def get_persona_permissions(persona: UserPersona) -> PersonaPermissions:
    return get_persona_info(persona).permissions

def check_permission(
    persona: UserPersona,
    intent: QueryIntent,
    target_classes: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Validate whether the given persona has permission for the requested intent/workflow.
    Enforces strict server-side RBAC.
    """
    p_info = get_persona_info(persona)
    perms = p_info.permissions
    target_classes = target_classes or []

    # 1. Infrastructure Intelligence & Tactical Object Detection/Counting
    if intent in (QueryIntent.OBJECT_DETECTION, QueryIntent.OBJECT_COUNT):
        is_humanitarian = any(c.lower() in ["settlement", "village", "residential", "housing", "town", "community", "human settlement", "affected"] for c in target_classes)
        if not is_humanitarian and not perms.can_detect_infrastructure:
            return {
                "allowed": False,
                "error": "PERMISSION_DENIED",
                "message": f"Persona '{persona.value}' does not possess clearance for '{intent.value}' workflow. "
                           f"Infrastructure intelligence & tactical object detection requires ISRO_ANALYST clearance.",
                "persona": persona.value,
                "required_permission": "can_detect_infrastructure"
            }

    # 2. Emergency Flood & Disaster Inundation Operations
    if intent == QueryIntent.FLOOD_DETECTION:
        if not perms.can_view_emergency_layers:
            return {
                "allowed": False,
                "error": "PERMISSION_DENIED",
                "message": f"Persona '{persona.value}' does not possess clearance for '{intent.value}' workflow. "
                           f"Operational disaster response & SAR flood mapping requires NDRF_OFFICER or ISRO_ANALYST clearance.",
                "persona": persona.value,
                "required_permission": "can_view_emergency_layers"
            }

    # 3. Restricted Synthetic Aperture Radar (SAR) Analysis
    is_sar_requested = any(c.lower() in ["sar", "radar", "backscatter", "c-sar", "polarization"] for c in target_classes)
    if intent == QueryIntent.SPECTRAL_ANALYSIS and is_sar_requested:
        if not perms.can_access_sar:
            return {
                "allowed": False,
                "error": "PERMISSION_DENIED",
                "message": f"Persona '{persona.value}' is restricted from accessing raw SAR radar workflows. "
                           f"SAR processing requires ISRO_ANALYST or NDRF_OFFICER clearance.",
                "persona": persona.value,
                "required_permission": "can_access_sar"
            }

    return {
        "allowed": True,
        "persona": persona.value,
        "max_export_level": perms.max_export_level
    }

