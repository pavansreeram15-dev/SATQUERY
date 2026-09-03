import time
import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from .base_provider import SatelliteProvider

class PlanetaryComputerProvider(SatelliteProvider):
    """
    Microsoft Planetary Computer STAC Provider.
    Provides keyless, public Earth-observation STAC catalog discovery for:
    - Landsat 8/9 Collection 2 Level-2 ('landsat-c2-l2')
    - Sentinel-2 Level-2A ('sentinel-2-l2a')
    - Sentinel-1 SAR GRD / RTC ('sentinel-1-grd', 'sentinel-1-rtc')
    - Copernicus Digital Elevation Model ('cop-dem-glo-30')
    """

    STAC_SEARCH_URL = "https://planetarycomputer.microsoft.com/api/stac/v1/search"

    def __init__(self):
        super().__init__(
            name="Planetary Computer",
            display_name="Microsoft Planetary Computer (Public STAC)",
            auth_type="KEYLESS"
        )

    def is_configured(self) -> bool:
        # Planetary Computer STAC search endpoint is openly accessible without API key
        return True

    async def search_catalog(
        self,
        bbox: List[float],
        from_date: str = "2023-01-01",
        to_date: str = "2026-12-31",
        collection: Optional[str] = "sentinel-2-l2a",
        max_cloud_cover: float = 30.0,
        limit: int = 5
    ) -> Dict[str, Any]:
        """
        Search Planetary Computer STAC catalog.
        """
        start_time = time.time()
        col = collection or "sentinel-2-l2a"
        
        payload: Dict[str, Any] = {
            "bbox": bbox,
            "datetime": f"{from_date}T00:00:00Z/{to_date}T23:59:59Z",
            "collections": [col],
            "limit": limit
        }

        # Query cloud cover filter for optical sensors
        if "sentinel-2" in col or "landsat" in col:
            payload["query"] = {
                "eo:cloud_cover": {"lte": max_cloud_cover}
            }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(self.STAC_SEARCH_URL, json=payload)
                self._last_latency_ms = int((time.time() - start_time) * 1000)
                self._last_health_check = datetime.now(timezone.utc).isoformat()

                if resp.status_code == 200:
                    data = resp.json()
                    raw_features = data.get("features", [])
                    
                    normalized_items = []
                    for f in raw_features:
                        props = f.get("properties", {})
                        assets = f.get("assets", {})
                        
                        # Extract thumbnail / preview if available
                        rendered_preview = assets.get("rendered_preview", {}).get("href") or assets.get("thumbnail", {}).get("href")
                        
                        normalized_items.append({
                            "id": f.get("id"),
                            "collection": col,
                            "provider": "Planetary Computer",
                            "datetime": props.get("datetime"),
                            "cloud_cover": props.get("eo:cloud_cover", 0.0),
                            "platform": props.get("platform", "Sentinel-2 / Landsat"),
                            "instruments": props.get("instruments", ["MSI/OLI"]),
                            "bbox": f.get("bbox", bbox),
                            "geometry": f.get("geometry"),
                            "preview_url": rendered_preview,
                            "resolution_meters": 10.0 if "sentinel-2" in col else (30.0 if "landsat" in col else 10.0)
                        })

                    return {
                        "success": True,
                        "provider": "Planetary Computer",
                        "collection": col,
                        "count": len(normalized_items),
                        "features": normalized_items,
                        "latency_ms": self._last_latency_ms
                    }
                else:
                    return {
                        "success": False,
                        "provider": "Planetary Computer",
                        "reason": f"Planetary Computer STAC error HTTP {resp.status_code}",
                        "count": 0,
                        "features": []
                    }
        except Exception as e:
            self._last_latency_ms = int((time.time() - start_time) * 1000)
            self._last_health_check = datetime.now(timezone.utc).isoformat()
            return {
                "success": False,
                "provider": "Planetary Computer",
                "reason": f"Planetary Computer request failed: {str(e)}",
                "count": 0,
                "features": []
            }

planetary_computer_provider = PlanetaryComputerProvider()
