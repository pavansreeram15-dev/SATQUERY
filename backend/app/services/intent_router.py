import re
from typing import Tuple, List, Optional
from ..schemas.persona_schemas import QueryIntent, UserPersona

def classify_intent(prompt: str, persona: UserPersona = UserPersona.PUBLIC_RESEARCHER) -> Tuple[QueryIntent, float]:
    """
    Deterministically classify the user's natural language query into a remote sensing intent.
    Supports initial queries, signature workflows, and conversational follow-ups.
    """
    text = prompt.lower().strip()

    # 1. Specific count pattern
    if re.search(r'\b(count|how many|number of|total quantity)\b', text):
        return QueryIntent.OBJECT_COUNT, 0.96

    # 2. Flood, Inundation & Disaster Settlement Impact ("find affected settlement areas", "submerged villages", "why did this flood?")
    if re.search(r'\b(flood|flooded|flooding|inundat|inundation|submerged|waterlog|high water|affected settlement|affected village|submerged village|submerged settlement|inundated settlement|inundated area|disaster impact|why did this area experience flooding|water coverage increase|water rise)\b', text):
        return QueryIntent.FLOOD_DETECTION, 0.95

    # 3. Change detection & temporal comparisons & follow-ups ("explain what changed", "show the biggest change", "compare with last year")
    if re.search(r'\b(change|changes|compare|expansion|growth|loss|gain|between \d{4} and \d{4}|from \d{4} to \d{4}|before and after|difference|diff|explain what changed|show biggest change|show the biggest change|why might this have changed|what changed)\b', text):
        return QueryIntent.CHANGE_DETECTION, 0.94

    # 4. NDVI & Vegetation analysis & follow-ups ("how much vegetation was lost?", "vegetation stress")
    if re.search(r'\b(ndvi|vegetation|crop|forest|canopy|greenery|biomass|plant health|vegetation health|chlorophyll|how much vegetation was lost|vegetation stress|crop health)\b', text):
        return QueryIntent.NDVI_ANALYSIS, 0.93

    # 5. NDWI & Water body detection
    if re.search(r'\b(ndwi|water bod|reservoir|lake|river|water extent|wetland|estuary|aquatic|shoreline|coastal change)\b', text):
        return QueryIntent.NDWI_ANALYSIS, 0.93

    # 6. Maritime, Live AIS Vessel & Gigawatt Submarine Cable queries
    if re.search(r'\b(vessel|vessels|ais|ship tracking|maritime|ship mmsi|mmsi|track this vessel|vessels matching|vessels near|cargo ship|cargo ships|tanker|tankers|suez canal|panama canal|port of|cable|cables|submarine cable|landing point|fiber optic|gigawatt)\b', text):
        return QueryIntent.MARITIME_VESSEL_TRACKING, 0.95

    # 7. Spectral & SAR analysis
    if re.search(r'\b(spectral|sar|radar|backscatter|band ratio|reflectance|multi-spectral|c-sar|polarization)\b', text):
        return QueryIntent.SPECTRAL_ANALYSIS, 0.91

    # 8. Settlement & Object detection / localization
    if re.search(r'\b(detect|find|identify|locate|spot|where are|highlight|settlement|settlements|village|villages|residential area)\b', text):
        return QueryIntent.OBJECT_DETECTION, 0.92

    # 8. Segmentation & delineation
    if re.search(r'\b(segment|segmentation|delineat|contour|mask|sam|boundary|delineation)\b', text):
        return QueryIntent.SEGMENT_TERRAIN, 0.90

    # 9. Persona-aware fallback priors for ambiguous queries (e.g. "Analyze this area", "Inspect region")
    if persona == UserPersona.NDRF_OFFICER:
        return QueryIntent.FLOOD_DETECTION, 0.80
    elif persona == UserPersona.ISRO_ANALYST:
        return QueryIntent.OBJECT_DETECTION, 0.80
    else:
        return QueryIntent.NDVI_ANALYSIS, 0.75

route_intent = classify_intent
