import re
from typing import Dict, Any, List, Optional, Tuple
from ..schemas.persona_schemas import QueryIntent, UserPersona
from .intent_router import classify_intent

CLASS_KEYWORDS = {
    "cargo_ship": ["cargo ship", "cargo ships", "vessel", "vessels", "ship", "ships", "boat", "boats", "freighter", "container ship"],
    "storage_tank": ["storage tank", "storage tanks", "oil tank", "fuel tank", "silo", "tanks"],
    "building": ["building", "buildings", "infrastructure", "structure", "structures", "facility", "facilities", "house", "warehouse"],
    "settlement": ["settlement", "settlements", "village", "villages", "residential", "residential area", "housing", "town", "community", "neighborhood", "populated area", "human settlement", "affected settlement", "affected area", "affected village"],
    "aircraft": ["aircraft", "airplane", "airplanes", "plane", "planes", "jet", "jets", "runway aircraft"],
    "urban": ["urban", "built-up", "construction", "city", "expansion"],
    "vegetation": ["vegetation", "canopy", "forest", "tree", "trees", "crop", "mangrove", "greenery"],
    "water": ["water", "water body", "river", "lake", "reservoir", "ocean", "sea", "bay", "harbor"],
    "flood": ["flood", "flooded", "inundated", "submerged", "affected", "impacted", "waterlogged"]
}

REGION_KEYWORDS = {
    "Chennai Port": ["chennai", "chennai port", "chennai harbor", "ennoor"],
    "Assam Flood Region": ["assam", "brahmaputra", "guwahati", "kaziranga"],
    "Bengaluru Urban Region": ["bengaluru", "bangalore", "whitefield", "electronic city", "outer ring road"],
    "Mumbai Coastal Region": ["mumbai", "jnpt", "bombay", "mumbai harbor", "navi mumbai"],
    "Sundarbans": ["sundarban", "sundarbans", "delta", "mangrove reserve"],
    "Kochi Coastal Region": ["kochi", "cochin", "kochi port"],
    "Delhi Urban Region": ["delhi", "ncr", "yamuna"],
    "Nepal Flood Region": ["nepal", "kathmandu", "pokhara", "koshi", "gandaki"],
    "Pakistan Flood Region": ["pakistan", "indus", "sindh", "balochistan"],
    "Bangladesh Flood Region": ["bangladesh", "dhaka", "sylhet", "jamuna"],
    "California Wildfire Region": ["california", "los angeles", "san francisco"],
    "Valencia Flood Region": ["valencia", "spain flood"]
}

def parse_query(
    prompt: str,
    viewport_bbox: Optional[List[float]] = None,
    persona: UserPersona = UserPersona.PUBLIC_RESEARCHER,
    explicit_target_classes: Optional[List[str]] = None,
    explicit_before_year: Optional[int] = None,
    explicit_after_year: Optional[int] = None
) -> Dict[str, Any]:
    """
    Comprehensive query parser extracting intent, target classes, temporal parameters, and geographic references.
    """
    text = prompt.lower().strip()
    
    # 1. Classify Intent
    intent, intent_confidence = classify_intent(prompt, persona)
    
    # 2. Extract Target Classes
    extracted_classes: List[str] = []
    if explicit_target_classes and len(explicit_target_classes) > 0:
        extracted_classes = explicit_target_classes
    else:
        for class_name, keywords in CLASS_KEYWORDS.items():
            if any(re.search(r'\b' + re.escape(kw) + r'\b', text) for kw in keywords):
                extracted_classes.append(class_name)
    
    # Default classes based on intent if none found
    if not extracted_classes:
        if intent in (QueryIntent.OBJECT_COUNT, QueryIntent.OBJECT_DETECTION):
            extracted_classes = ["cargo_ship"]
        elif intent == QueryIntent.FLOOD_DETECTION:
            extracted_classes = ["flood", "water"]
        elif intent == QueryIntent.NDVI_ANALYSIS:
            extracted_classes = ["vegetation"]
        elif intent == QueryIntent.NDWI_ANALYSIS:
            extracted_classes = ["water"]
        elif intent == QueryIntent.CHANGE_DETECTION:
            extracted_classes = ["urban", "vegetation"]
        else:
            extracted_classes = ["general_feature"]

    # 3. Extract Years (e.g. "between 2023 and 2025", "from 2022 to 2026")
    before_year = explicit_before_year
    after_year = explicit_after_year
    
    year_matches = [int(y) for y in re.findall(r'\b(20\d{2}|19\d{2})\b', text)]
    if len(year_matches) >= 2:
        before_year = min(year_matches[0], year_matches[1])
        after_year = max(year_matches[0], year_matches[1])
    elif len(year_matches) == 1 and not before_year:
        before_year = year_matches[0] - 2
        after_year = year_matches[0]
    elif not before_year and intent == QueryIntent.CHANGE_DETECTION:
        before_year = 2022
        after_year = 2026

    # 4. Extract Named Region
    detected_region: Optional[str] = None
    for region_name, keywords in REGION_KEYWORDS.items():
        if any(re.search(r'\b' + re.escape(kw) + r'\b', text) for kw in keywords):
            detected_region = region_name
            break

    return {
        "intent": intent,
        "intent_confidence": intent_confidence,
        "target_classes": extracted_classes,
        "before_year": before_year,
        "after_year": after_year,
        "detected_region": detected_region,
        "viewport_bbox": viewport_bbox,
        "persona": persona
    }
