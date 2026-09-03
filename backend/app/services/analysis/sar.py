from ..sentinel_service import sentinel_service

async def execute_sar_analysis(bbox: list, target_classes: list = None):
    return await sentinel_service.execute_live_analysis("FLOOD_DETECTION", bbox, target_classes)
