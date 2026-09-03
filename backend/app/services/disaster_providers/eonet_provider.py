import os
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from .base_provider import BaseDisasterProvider
from ...schemas.disaster_schemas import EarthEvent, DisasterType, DisasterSeverity, DisasterAlertLevel

logger = logging.getLogger(__name__)

CATEGORY_MAP = {
    "wildfires": DisasterType.WILDFIRE,
    "volcanoes": DisasterType.VOLCANO,
    "severestorms": DisasterType.STORM,
    "tropicalcyclones": DisasterType.CYCLONE,
    "floods": DisasterType.FLOOD,
    "earthquakes": DisasterType.EARTHQUAKE,
    "drought": DisasterType.DROUGHT,
    "landslides": DisasterType.OTHER,
    "sealakeice": DisasterType.OTHER,
    "temp_extremes": DisasterType.OTHER
}

class EONETDisasterProvider(BaseDisasterProvider):
    """
    NASA Earth Observatory Natural Event Tracker (EONET v3) provider adapter.
    Provides live global tracking of wildfires, volcanoes, severe storms, cyclones, and floods.
    """
    BASE_URL = "https://eonet.gsfc.nasa.gov/api/v3/events"

    def __init__(self):
        poll_interval = int(os.getenv("EONET_POLL_INTERVAL", 300))
        super().__init__(name="EONET", default_poll_interval=poll_interval, requires_key=False)

    async def fetch_events(self, time_range: str = "24h", limit: int = 100) -> List[EarthEvent]:
        days = 30 if time_range in ["30d", "all"] else (7 if time_range == "7d" else 2)
        params = {
            "days": days,
            "status": "open" if time_range in ["1h", "24h"] else "all",
            "limit": limit
        }
        
        response = await self._safe_http_get(self.BASE_URL, params=params, timeout_seconds=12.0)
        if not response:
            logger.warning("[EONET] Failed to retrieve live EONET feed, returning cached events.")
            return self.last_events

        events: List[EarthEvent] = []
        try:
            data = response.json()
            raw_events = data.get("events", [])

            for ev in raw_events:
                event_id = str(ev.get("id") or "")
                title = ev.get("title") or "Unnamed Natural Event"
                description = ev.get("description")
                
                # Category parsing
                categories = ev.get("categories", [])
                cat_id = categories[0].get("id", "").lower() if categories else "other"
                disaster_type = CATEGORY_MAP.get(cat_id, DisasterType.OTHER)

                # Geometry extraction (most recent geometry item)
                geometries = ev.get("geometry", [])
                if not geometries:
                    continue

                latest_geom = geometries[-1]
                coords = latest_geom.get("coordinates", [])
                geom_type = latest_geom.get("type", "Point")

                lat, lon = 0.0, 0.0
                if geom_type == "Point" and len(coords) >= 2:
                    lon = float(coords[0])
                    lat = float(coords[1])
                elif geom_type == "Polygon" and coords and coords[0]:
                    # Centroid of polygon
                    ring = coords[0]
                    lon = sum(pt[0] for pt in ring) / len(ring)
                    lat = sum(pt[1] for pt in ring) / len(ring)
                else:
                    continue

                event_date = latest_geom.get("date")
                magnitude_val = latest_geom.get("magnitudeValue")
                magnitude_unit = latest_geom.get("magnitudeUnit")

                # Compute severity based on event type & magnitude
                severity = DisasterSeverity.MAJOR
                alert = DisasterAlertLevel.ORANGE

                if disaster_type == DisasterType.WILDFIRE:
                    severity = DisasterSeverity.MAJOR
                    alert = DisasterAlertLevel.ORANGE
                elif disaster_type == DisasterType.VOLCANO:
                    severity = DisasterSeverity.SEVERE
                    alert = DisasterAlertLevel.RED
                elif disaster_type == DisasterType.CYCLONE or disaster_type == DisasterType.STORM:
                    severity = DisasterSeverity.CRITICAL if (magnitude_val and magnitude_val > 100) else DisasterSeverity.MAJOR
                    alert = DisasterAlertLevel.RED if (magnitude_val and magnitude_val > 100) else DisasterAlertLevel.ORANGE
                elif disaster_type == DisasterType.FLOOD:
                    severity = DisasterSeverity.MAJOR
                    alert = DisasterAlertLevel.ORANGE
                elif disaster_type == DisasterType.DROUGHT:
                    severity = DisasterSeverity.MAJOR
                    alert = DisasterAlertLevel.ORANGE

                sources = ev.get("sources", [])
                source_url = sources[0].get("url") if sources else None

                event = EarthEvent(
                    id=f"dis-eonet-{event_id}",
                    source="EONET",
                    sources=["EONET"],
                    source_event_id=event_id,
                    type=disaster_type,
                    title=title,
                    description=description or f"Natural event classified under NASA EONET {cat_id.capitalize()}.",
                    latitude=lat,
                    longitude=lon,
                    magnitude=float(magnitude_val) if magnitude_val is not None else None,
                    severity=severity,
                    alert_level=alert,
                    confidence=0.92,
                    start_time=event_date,
                    updated_time=event_date,
                    country=None,
                    region=title.split(" - ")[-1] if " - " in title else None,
                    source_url=source_url or f"https://eonet.gsfc.nasa.gov/api/v3/events/{event_id}",
                    geometry={
                        "type": geom_type,
                        "coordinates": coords
                    },
                    raw_source={
                        "category": cat_id,
                        "magnitude_unit": magnitude_unit,
                        "closed": ev.get("closed"),
                        "sources_count": len(sources)
                    }
                )
                events.append(event)

            self.last_events = events
            self.last_poll_time = datetime.now(timezone.utc)
            logger.info(f"[EONET] Successfully fetched and normalized {len(events)} Earth events.")
            return events
        except Exception as e:
            self.last_error = f"Parsing error: {e}"
            logger.error(f"[EONET] Error parsing feed data: {e}")
            return self.last_events

eonet_provider = EONETDisasterProvider()
