from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

class SatelliteProvider(ABC):
    """
    Abstract Base Class for Earth Observation & Satellite Data Providers.
    Standardizes catalog search, imagery metadata discovery, and health telemetry.
    """

    def __init__(self, name: str, display_name: str, auth_type: str):
        self.name = name
        self.display_name = display_name
        self.auth_type = auth_type  # "KEYLESS", "API_KEY", "OAUTH2", "SERVICE_ACCOUNT"
        self._last_health_check: Optional[str] = None
        self._is_healthy: bool = True
        self._last_latency_ms: int = 0

    @abstractmethod
    def is_configured(self) -> bool:
        """Return True if credentials or public endpoints are configured."""
        pass

    @abstractmethod
    async def search_catalog(
        self,
        bbox: List[float],
        from_date: str,
        to_date: str,
        collection: Optional[str] = None,
        max_cloud_cover: float = 30.0,
        limit: int = 5
    ) -> Dict[str, Any]:
        """
        Search satellite STAC catalog for observations matching spatial AOI and date range.
        Returns standardized dictionary with success flag, items list, and count.
        """
        pass

    def get_health(self) -> Dict[str, Any]:
        """Return provider operational health telemetry."""
        return {
            "provider_name": self.name,
            "display_name": self.display_name,
            "status": "OPERATIONAL" if self.is_configured() else "AVAILABLE_LOCAL_FALLBACK",
            "auth_type": self.auth_type,
            "is_configured": self.is_configured(),
            "last_checked": self._last_health_check or datetime.now(timezone.utc).isoformat(),
            "latency_ms": self._last_latency_ms
        }
