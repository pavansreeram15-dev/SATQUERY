import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import httpx
from ...schemas.disaster_schemas import EarthEvent, DisasterProviderHealth

logger = logging.getLogger(__name__)

class BaseDisasterProvider(ABC):
    """
    Abstract asynchronous disaster provider adapter.
    Handles HTTP timeouts, retries, health tracking, and normalized event generation.
    """
    def __init__(self, name: str, default_poll_interval: int = 300, requires_key: bool = False):
        self.name = name
        self.poll_interval = default_poll_interval
        self.requires_key = requires_key
        self.last_poll_time: Optional[datetime] = None
        self.last_error: Optional[str] = None
        self.last_events: List[EarthEvent] = []
        self.status = "OPERATIONAL"

    @abstractmethod
    async def fetch_events(self, time_range: str = "24h", limit: int = 100) -> List[EarthEvent]:
        """Fetch and normalize disaster events from the upstream official API."""
        pass

    def get_health(self) -> DisasterProviderHealth:
        return DisasterProviderHealth(
            provider_name=self.name,
            status=self.status,
            last_poll_time=self.last_poll_time.isoformat() if self.last_poll_time else None,
            event_count=len(self.last_events),
            poll_interval_seconds=self.poll_interval,
            requires_api_key=self.requires_key,
            is_authenticated=True if not self.requires_key else self.is_configured(),
            error_message=self.last_error
        )

    def is_configured(self) -> bool:
        """Override in key-requiring providers like NASA FIRMS."""
        return True

    async def _safe_http_get(
        self,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout_seconds: float = 12.0
    ) -> Optional[Any]:
        """Execute resilient HTTP GET with structured error capture."""
        try:
            async with httpx.AsyncClient(timeout=timeout_seconds, follow_redirects=True) as client:
                response = await client.get(url, params=params, headers=headers)
                if response.status_code == 200:
                    self.status = "OPERATIONAL"
                    self.last_error = None
                    return response
                else:
                    self.status = "DEGRADED"
                    self.last_error = f"HTTP {response.status_code}: {response.text[:200]}"
                    logger.warning(f"[{self.name}] Provider returned non-200 status: {response.status_code}")
                    return None
        except httpx.TimeoutException:
            self.status = "DEGRADED"
            self.last_error = f"Connection timed out after {timeout_seconds}s"
            logger.warning(f"[{self.name}] Request timed out: {url}")
            return None
        except Exception as e:
            self.status = "UNAVAILABLE"
            self.last_error = str(e)
            logger.error(f"[{self.name}] Network error fetching events: {e}")
            return None
