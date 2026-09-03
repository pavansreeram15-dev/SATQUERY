from typing import Dict, Any, Optional
from fastapi import APIRouter, Query, Body
from ...services.knowledge_service import knowledge_service

router = APIRouter()

@router.get("/knowledge/wiki")
async def get_wikipedia_knowledge(
    q: Optional[str] = Query(None, description="Region, city, river, or place name"),
    lat: Optional[float] = Query(None, description="Latitude coordinate"),
    lon: Optional[float] = Query(None, description="Longitude coordinate")
):
    """
    Fetch factual geographical, topographical, and demographic context via official MediaWiki GeoSearch API.
    """
    if lat is not None and lon is not None:
        wiki_info = await knowledge_service.get_wikipedia_geosearch(lat=lat, lon=lon)
        return {"query": q or f"({lat}, {lon})", "knowledge": wiki_info}
    elif q:
        wiki_info = await knowledge_service.get_wikipedia_summary(query_or_place=q)
        return {"query": q, "knowledge": wiki_info}
    
    return {"query": None, "knowledge": {"status": "NO_DATA", "message": "Latitude and longitude or query parameter required."}}

@router.post("/knowledge/brief")
async def get_ai_knowledge_brief(request: Dict[str, Any] = Body(...)):
    """
    Synthesize multi-paragraph scientific intelligence briefing via Google Gemini or local engine.
    """
    query = request.get("query", "")
    region_name = request.get("region_name", "Survey Area")
    intent = request.get("intent", "GENERAL_GIS_VQA")
    metrics = request.get("metrics", {})
    weather = request.get("weather_context")
    wiki = request.get("wiki_context")

    brief = await knowledge_service.generate_gemini_descriptive_brief(
        query=query,
        region_name=region_name,
        intent=intent,
        metrics=metrics,
        weather_context=weather,
        wiki_context=wiki
    )
    return {"query": query, "region_name": region_name, "brief": brief}
