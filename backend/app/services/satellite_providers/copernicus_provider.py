import time
import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from .base_provider import SatelliteProvider
from ..sentinel_service import sentinel_service

class CopernicusProvider(SatelliteProvider):
    """
    Copernicus Data Space Ecosystem (CDSE) & Sentinel Hub Provider.
    Supports Sentinel-2 L2A optical, Sentinel-1 C-SAR radar, and Sentinel-3 observations.
    """

    CDSE_PUBLIC_STAC_URL = "https://catalogue.dataspace.copernicus.eu/stac/search"

    def __init__(self):
        super().__init__(
            name="Copernicus Data Space",
            display_name="Copernicus Data Space Ecosystem (CDSE / Sentinel Hub)",
            auth_type="OAUTH2" if sentinel_service.is_configured() else "KEYLESS"
        )

    def is_configured(self) -> bool:
        return sentinel_service.is_configured() or True # Open CDSE STAC is queryable

    async def search_catalog(
        self,
        bbox: List[float],
        from_date: str = "2023-01-01",
        to_date: str = "2026-12-31",
        collection: Optional[str] = "SENTINEL-2",
        max_cloud_cover: float = 30.0,
        limit: int = 5
    ) -> Dict[str, Any]:
        """Search Copernicus Data Space STAC catalog."""
        start_time = time.time()
        
        # 1. If Sentinel Hub OAuth2 is configured, query authenticated Sentinel Hub Process/Catalog API
        if sentinel_service.is_configured():
            sh_col = "sentinel-1-grd" if collection and "1" in collection else "sentinel-2-l2a"
            res = await sentinel_service.search_catalog(
                bbox=bbox,
                from_date=from_date,
                to_date=to_date,
                collection=sh_col,
                max_cloud_cover=max_cloud_cover,
                limit=limit
            )
            self._last_latency_ms = int((time.time() - start_time) * 1000)
            self._last_health_check = datetime.now(timezone.utc).isoformat()
            if res.get("success"):
                features = []
                for f in res.get("features", []):
                    props = f.get("properties", {})
                    features.append({
                        "id": f.get("id"),
                        "collection": sh_col,
                        "provider": "Copernicus Sentinel Hub",
                        "datetime": props.get("datetime"),
                        "cloud_cover": props.get("eo:cloud_cover", 0.0),
                        "platform": "Sentinel-2" if "2" in sh_col else "Sentinel-1",
                        "instruments": ["MSI"] if "2" in sh_col else ["C-SAR"],
                        "bbox": f.get("bbox", bbox),
                        "geometry": f.get("geometry"),
                        "resolution_meters": 10.0
                    })
                return {
                    "success": True,
                    "provider": "Copernicus Sentinel Hub",
                    "count": len(features),
                    "features": features,
                    "latency_ms": self._last_latency_ms
                }

        # 2. Keyless Public CDSE STAC Search Fallback
        col = "SENTINEL-2" if not collection else collection
        payload: Dict[str, Any] = {
            "bbox": bbox,
            "datetime": f"{from_date}T00:00:00Z/{to_date}T23:59:59Z",
            "collections": [col],
            "limit": limit
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(self.CDSE_PUBLIC_STAC_URL, json=payload)
                self._last_latency_ms = int((time.time() - start_time) * 1000)
                self._last_health_check = datetime.now(timezone.utc).isoformat()

                if resp.status_code == 200:
                    data = resp.json()
                    raw_features = data.get("features", [])
                    features = []
                    for f in raw_features:
                        props = f.get("properties", {})
                        features.append({
                            "id": f.get("id"),
                            "collection": col,
                            "provider": "Copernicus Data Space",
                            "datetime": props.get("datetime") or props.get("startDate"),
                            "cloud_cover": props.get("cloudCover", 0.0),
                            "platform": props.get("platform", "Sentinel"),
                            "instruments": props.get("instruments", ["MSI/SAR"]),
                            "bbox": f.get("bbox", bbox),
                            "geometry": f.get("geometry"),
                            "resolution_meters": 10.0
                        })
                    return {
                        "success": True,
                        "provider": "Copernicus Data Space",
                        "count": len(features),
                        "features": features,
                        "latency_ms": self._last_latency_ms
                    }
                else:
                    return {
                        "success": False,
                        "provider": "Copernicus Data Space",
                        "reason": f"CDSE STAC returned HTTP {resp.status_code}",
                        "count": 0,
                        "features": []
                    }
        except Exception as e:
            self._last_latency_ms = int((time.time() - start_time) * 1000)
            self._last_health_check = datetime.now(timezone.utc).isoformat()
            return {
                "success": False,
                "provider": "Copernicus Data Space",
                "reason": f"CDSE STAC query failed: {str(e)}",
                "count": 0,
                "features": []
            }

copernicus_provider = CopernicusProvider()
