from ..knowledge_service import knowledge_service

async def process_multimodal_synthesis(query: str, region_name: str, metrics: dict, weather: dict = None, wiki: dict = None):
    return await knowledge_service.generate_gemini_descriptive_brief(
        query=query,
        region_name=region_name,
        intent="MULTIMODAL",
        metrics=metrics,
        weather_context=weather,
        wiki_context=wiki
    )
