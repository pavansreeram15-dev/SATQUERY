from ..sentinel_service import sentinel_service

async def fetch_sentinel1_sar(bbox: list, target_classes: list = None):
    """Sentinel-1 SAR C-band radar observations handler."""
    return await sentinel_service.execute_live_analysis(
        intent="FLOOD_DETECTION",
        bbox=bbox,
        target_classes=target_classes or ["water_body", "inundation"]
    )
