from ..knowledge_service import knowledge_service

async def process_visual_qa(prompt: str, image_metadata: dict):
    return await knowledge_service.get_wikipedia_summary(prompt)
