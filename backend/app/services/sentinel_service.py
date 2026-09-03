import os
import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

class SentinelService:
    """
    Sentinel Hub Process API and STAC Catalog API integration.
    Secure backend-only client supporting both Copernicus Data Space Ecosystem (CDSE) and Sentinel Hub.
    """
    def __init__(self):
        self.cdse_auth_url = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
        self.legacy_auth_url = "https://services.sentinel-hub.com/oauth/token"
        self.cdse_catalog_url = "https://sh.dataspace.copernicus.eu/api/v1/catalog/1.0.0/search"
        self.legacy_catalog_url = "https://services.sentinel-hub.com/api/v1/catalog/1.0.0/search"
        self.access_token: Optional[str] = None
        self.is_cdse: bool = True

    @property
    def client_id(self) -> str:
        return os.getenv("SENTINELHUB_CLIENT_ID", "").strip()

    @property
    def client_secret(self) -> str:
        return os.getenv("SENTINELHUB_CLIENT_SECRET", "").strip()

    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    async def get_auth_token(self) -> Optional[str]:
        """Authenticate with Copernicus CDSE or Sentinel Hub OAuth2."""
        if not self.is_configured():
            return None
        
        if self.access_token:
            return self.access_token

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                # 1. Try Copernicus CDSE first
                resp = await client.post(
                    self.cdse_auth_url,
                    data={
                        "grant_type": "client_credentials",
                        "client_id": self.client_id,
                        "client_secret": self.client_secret
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    self.access_token = data.get("access_token")
                    self.is_cdse = True
                    return self.access_token

                # 2. Fallback to Legacy Sentinel Hub
                resp_leg = await client.post(
                    self.legacy_auth_url,
                    data={
                        "grant_type": "client_credentials",
                        "client_id": self.client_id,
                        "client_secret": self.client_secret
                    }
                )
                if resp_leg.status_code == 200:
                    data = resp_leg.json()
                    self.access_token = data.get("access_token")
                    self.is_cdse = False
                    return self.access_token
        except Exception:
            return None
        return None

    async def search_catalog(
        self,
        bbox: List[float],
        from_date: str = "2024-01-01",
        to_date: str = "2025-12-31",
        collection: str = "sentinel-2-l2a",
        max_cloud_cover: float = 30.0,
        limit: int = 5
    ) -> Dict[str, Any]:
        """Search Sentinel-2 L2A or Sentinel-1 GRD STAC catalog for imagery tiles."""
        if not self.is_configured():
            return {
                "success": False,
                "reason": "Sentinel Hub credentials (SENTINELHUB_CLIENT_ID / SENTINELHUB_CLIENT_SECRET) unconfigured.",
                "features": []
            }

        token = await self.get_auth_token()
        if not token:
            return {
                "success": False,
                "reason": "Sentinel Hub OAuth2 authentication failed with configured credentials.",
                "features": []
            }

        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload: Dict[str, Any] = {
            "bbox": bbox,
            "datetime": f"{from_date}T00:00:00Z/{to_date}T23:59:59Z",
            "collections": [collection],
            "limit": limit
        }
        if collection == "sentinel-2-l2a" and not self.is_cdse:
            payload["query"] = {"eo:cloud_cover": {"lte": max_cloud_cover}}

        catalog_url = self.cdse_catalog_url if self.is_cdse else self.legacy_catalog_url
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(catalog_url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    features = data.get("features", [])
                    return {
                        "success": True,
                        "features": features,
                        "count": len(features)
                    }
                else:
                    return {
                        "success": False,
                        "reason": f"Sentinel Hub Catalog API responded with HTTP {resp.status_code}: {resp.text[:120]}",
                        "features": []
                    }
        except httpx.TimeoutException:
            return {
                "success": False,
                "reason": "Sentinel Hub Catalog API request timed out after 15.0s.",
                "features": []
            }
        except Exception as e:
            return {
                "success": False,
                "reason": f"Sentinel Hub Catalog API error: {str(e)}",
                "features": []
            }

    async def execute_live_analysis(
        self,
        intent: str,
        bbox: List[float],
        target_classes: List[str],
        from_date: str = "2024-01-01",
        to_date: str = "2025-12-31"
    ) -> Dict[str, Any]:
        """
        Attempt actual live execution via Sentinel Hub.
        Returns result dictionary if successful, or error explanation if unavailable.
        """
        if not self.is_configured():
            return {
                "executed": False,
                "reason": "SENTINELHUB_CLIENT_ID or SENTINELHUB_CLIENT_SECRET environment variable is not configured."
            }

        collection = "sentinel-1-grd" if "sar" in target_classes or intent == "FLOOD_DETECTION" else "sentinel-2-l2a"
        search_res = await self.search_catalog(bbox=bbox, from_date=from_date, to_date=to_date, collection=collection)

        if not search_res["success"] or len(search_res["features"]) == 0:
            reason = search_res.get("reason", "No cloud-free Sentinel satellite tiles found matching AOI and date range.")
            return {
                "executed": False,
                "reason": reason
            }

        best_tile = search_res["features"][0]
        tile_props = best_tile.get("properties", {})
        cloud_pct = tile_props.get("eo:cloud_cover", 0.0)
        capture_dt = tile_props.get("datetime") or datetime.now(timezone.utc).isoformat()

        return {
            "executed": True,
            "data_source": "Sentinel Hub",
            "execution_mode": "LIVE",
            "dataset": f"{collection.upper()} (Tile: {best_tile.get('id', 'S2-TILE')})",
            "tile_id": best_tile.get("id"),
            "cloud_cover_percentage": cloud_pct,
            "capture_date": capture_dt,
            "bbox": best_tile.get("bbox", bbox),
            "geometry": best_tile.get("geometry")
        }

sentinel_service = SentinelService()

