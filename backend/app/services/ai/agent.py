from ..query_parser import parse_query
from ..knowledge_service import knowledge_service

class AIAgent:
    """Agentic orchestrator for natural language geospatial query parsing and knowledge synthesis."""
    def __init__(self):
        self.knowledge = knowledge_service

    def parse(self, prompt: str, **kwargs):
        return parse_query(prompt=prompt, **kwargs)

    async def summarize(self, query: str, region_name: str, metrics: dict, weather_context: dict = None):
        return await self.knowledge.generate_gemini_descriptive_brief(
            query=query,
            region_name=region_name,
            intent="GENERAL_GIS_VQA",
            metrics=metrics,
            weather_context=weather_context
        )

ai_agent = AIAgent()
