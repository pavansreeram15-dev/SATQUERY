from typing import Dict, Any
from fastapi import APIRouter, Query, Body
from ...services.knowledge_service import knowledge_service

router = APIRouter()

@router.get("/knowledge/wiki")
async def get_wikipedia_knowledge(
    q: str = Query(..., min_length=1, description="Region, city, river, or place name")
):
    """
    Fetch factual geographical, topographical, and demographic context via Wikipedia REST API.
    """
    wiki_info = await knowledge_service.get_wikipedia_summary(query_or_place=q)
    return {"query": q, "knowledge": wiki_info}

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
