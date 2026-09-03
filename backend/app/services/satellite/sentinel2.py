from ..sentinel_service import sentinel_service

async def fetch_sentinel2_optical(bbox: list, intent: str = "NDVI_ANALYSIS", target_classes: list = None):
    """Sentinel-2 MSI 10m Multispectral reflectance handler."""
    return await sentinel_service.execute_live_analysis(
        intent=intent,
        bbox=bbox,
        target_classes=target_classes or ["vegetation", "water"]
    )
