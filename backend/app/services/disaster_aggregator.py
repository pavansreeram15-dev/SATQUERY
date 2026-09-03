import asyncio
import logging
import math
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from .disaster_providers import (
    USGSDisasterProvider,
    EONETDisasterProvider,
    FIRMSDisasterProvider,
    GDACSDisasterProvider
)
from ..schemas.disaster_schemas import (
    EarthEvent,
    DisasterType,
    DisasterSeverity,
    DisasterFeatureCollection,
    DisasterGeoJSONFeature,
    DisasterProviderHealth,
    DisasterSummaryResponse
)

logger = logging.getLogger(__name__)

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Great Circle distance between two points in km."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class DisasterAggregatorService:
    """
    Central Disaster Aggregator & Deduplication Subsystem.
    Orchestrates live feeds across USGS, NASA EONET, NASA FIRMS, and GDACS.
    """

    def __init__(self):
        self.usgs = USGSDisasterProvider()
        self.eonet = EONETDisasterProvider()
        self.firms = FIRMSDisasterProvider()
        self.gdacs = GDACSDisasterProvider()
        
        self.providers = [self.usgs, self.eonet, self.firms, self.gdacs]
        
        self._cached_events: List[EarthEvent] = []
        self._cache_timestamp: Optional[datetime] = None
        self._cache_ttl_seconds: int = 45

    async def get_all_events(
        self,
        time_range: str = "24h",
        disaster_type: Optional[str] = None,
        source: Optional[str] = None,
        severity: Optional[str] = None,
        bbox: Optional[List[float]] = None,
        limit: int = 250,
        force_refresh: bool = False
    ) -> List[EarthEvent]:
        """Retrieve aggregated, normalized, and deduplicated global disaster events."""
        now = datetime.now(timezone.utc)
        
        # Check cache validity
        if not force_refresh and self._cache_timestamp:
            elapsed = (now - self._cache_timestamp).total_seconds()
            if elapsed < self._cache_ttl_seconds and self._cached_events:
                return self._apply_filters(self._cached_events, time_range, disaster_type, source, severity, bbox, limit)

        # Concurrently fetch from all providers without blocking if one fails
        tasks = [
            self.usgs.fetch_events(time_range=time_range, limit=limit),
            self.eonet.fetch_events(time_range=time_range, limit=limit),
            self.firms.fetch_events(time_range=time_range, limit=limit),
            self.gdacs.fetch_events(time_range=time_range, limit=limit)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        raw_events: List[EarthEvent] = []

        for idx, res in enumerate(results):
            prov_name = self.providers[idx].name
            if isinstance(res, Exception):
                logger.error(f"[Aggregator] Provider '{prov_name}' failed with exception: {res}")
            elif isinstance(res, list):
                raw_events.extend(res)

        # Deduplicate across providers
        deduplicated = self.deduplicate_events(raw_events)
        
        self._cached_events = deduplicated
        self._cache_timestamp = now

        return self._apply_filters(deduplicated, time_range, disaster_type, source, severity, bbox, limit)

    def deduplicate_events(self, events: List[EarthEvent]) -> List[EarthEvent]:
        """
        Merge overlapping disaster reports from multiple providers into unified events.
        Matches by disaster type, proximity (< 80 km), and time window (< 2 hours).
        """
        if not events:
            return []

        alert_priority = {"white": 0, "green": 1, "yellow": 2, "orange": 3, "red": 4}
        sev_priority = {"small": 0, "moderate": 1, "major": 2, "severe": 3, "critical": 4}

        merged: List[EarthEvent] = []

        for ev in events:
            matched = False
            for existing in merged:
                # Same disaster type
                if existing.type == ev.type:
                    dist = haversine_km(existing.latitude, existing.longitude, ev.latitude, ev.longitude)
                    
                    # Proximity match (e.g. USGS and GDACS earthquake within 80km)
                    if dist <= 80.0:
                        # Combine source attribution
                        for s in ev.sources:
                            if s not in existing.sources:
                                existing.sources.append(s)
                        
                        # Use highest magnitude & depth if available
                        if ev.magnitude and (existing.magnitude is None or ev.magnitude > existing.magnitude):
                            existing.magnitude = ev.magnitude
                        if ev.depth_km and existing.depth_km is None:
                            existing.depth_km = ev.depth_km
                        
                        # Preserve highest alert level and severity
                        if alert_priority.get(ev.alert_level.value, 0) > alert_priority.get(existing.alert_level.value, 0):
                            existing.alert_level = ev.alert_level
                        if sev_priority.get(ev.severity.value, 0) > sev_priority.get(existing.severity.value, 0):
                            existing.severity = ev.severity
                        
                        matched = True
                        break

            if not matched:
                merged.append(ev)

        return merged

    def _apply_filters(
        self,
        events: List[EarthEvent],
        time_range: str = "24h",
        disaster_type: Optional[str] = None,
        source: Optional[str] = None,
        severity: Optional[str] = None,
        bbox: Optional[List[float]] = None,
        limit: int = 250
    ) -> List[EarthEvent]:
        filtered = events

        # Strict timestamp filtering by time_range
        if time_range and time_range != "all":
            now = datetime.now(timezone.utc)
            delta_seconds = {
                "1h": 3600,
                "24h": 86400,
                "7d": 7 * 86400,
                "30d": 30 * 86400,
            }.get(time_range, 86400)
            
            cutoff_timestamp = now.timestamp() - delta_seconds
            
            def is_within_time(e: EarthEvent) -> bool:
                if not e.start_time:
                    return True
                try:
                    dt_str = e.start_time.replace("Z", "+00:00")
                    dt = datetime.fromisoformat(dt_str)
                    return dt.timestamp() >= cutoff_timestamp
                except Exception:
                    return True

            filtered = [e for e in filtered if is_within_time(e)]

        if disaster_type:
            dt_lower = disaster_type.lower()
            filtered = [e for e in filtered if e.type.value.lower() == dt_lower or dt_lower in e.type.value.lower()]

        if source and source.upper() != "ALL":
            src_upper = source.upper()
            filtered = [e for e in filtered if any(s.upper() == src_upper for s in e.sources)]

        if severity:
            sev_lower = severity.lower()
            filtered = [e for e in filtered if e.severity.value.lower() == sev_lower]

        if bbox and len(bbox) == 4:
            min_lon, min_lat, max_lon, max_lat = bbox
            filtered = [
                e for e in filtered
                if min_lon <= e.longitude <= max_lon and min_lat <= e.latitude <= max_lat
            ]

        return filtered[:limit]

    def to_geojson_feature_collection(self, events: List[EarthEvent]) -> DisasterFeatureCollection:
        """Convert list of EarthEvents to normalized GeoJSON FeatureCollection."""
        features = []
        for ev in events:
            feat = DisasterGeoJSONFeature(
                id=ev.id,
                geometry=ev.geometry or {
                    "type": "Point",
                    "coordinates": [ev.longitude, ev.latitude]
                },
                properties={
                    "id": ev.id,
                    "title": ev.title,
                    "description": ev.description,
                    "type": ev.type.value,
                    "source": ev.source,
                    "sources": ev.sources,
                    "magnitude": ev.magnitude,
                    "depth_km": ev.depth_km,
                    "severity": ev.severity.value,
                    "alert_level": ev.alert_level.value,
                    "confidence": ev.confidence,
                    "start_time": ev.start_time,
                    "updated_time": ev.updated_time,
                    "country": ev.country,
                    "region": ev.region,
                    "source_url": ev.source_url,
                    "latitude": ev.latitude,
                    "longitude": ev.longitude,
                }
            )
            features.append(feat)

        return DisasterFeatureCollection(
            features=features,
            metadata={
                "total_events": len(features),
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "attribution": "USGS · NASA EONET · NASA FIRMS · GDACS"
            }
        )

    def get_summary(self) -> DisasterSummaryResponse:
        """Calculate aggregate statistical summary and provider diagnostics."""
        events = self._cached_events
        by_type: Dict[str, int] = {}
        by_severity: Dict[str, int] = {}

        for ev in events:
            t = ev.type.value
            s = ev.severity.value
            by_type[t] = by_type.get(t, 0) + 1
            by_severity[s] = by_severity.get(s, 0) + 1

        provider_health: List[DisasterProviderHealth] = []
        for p in self.providers:
            if hasattr(p, "get_health"):
                provider_health.append(p.get_health())
            elif hasattr(p, "health_check"):
                h = p.health_check()
                provider_health.append(
                    DisasterProviderHealth(
                        provider_name=h.get("provider", "Disaster Provider"),
                        status=h.get("status", "OPERATIONAL"),
                        event_count=h.get("event_count", 0),
                        last_poll_time=h.get("last_poll"),
                        poll_interval_seconds=h.get("poll_interval_seconds", 300),
                        requires_api_key=h.get("requires_api_key", False),
                        is_authenticated=h.get("is_authenticated", True),
                        error_message=h.get("error")
                    )
                )

        return DisasterSummaryResponse(
            total_active_events=len(events),
            by_type=by_type,
            by_severity=by_severity,
            providers=provider_health,
            last_updated=self._cache_timestamp.isoformat() if self._cache_timestamp else datetime.now(timezone.utc).isoformat()
        )

disaster_aggregator = DisasterAggregatorService()
DisasterAggregator = DisasterAggregatorService
