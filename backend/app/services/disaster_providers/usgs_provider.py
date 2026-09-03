import os
import logging
from typing import List, Optional
from datetime import datetime, timezone
from .base_provider import BaseDisasterProvider
from ...schemas.disaster_schemas import EarthEvent, DisasterType, DisasterSeverity, DisasterAlertLevel

logger = logging.getLogger(__name__)

class USGSDisasterProvider(BaseDisasterProvider):
    """
    USGS Earthquake API provider adapter.
    Fetches real-time seismic event GeoJSON feeds with magnitude, depth, location, and telemetry.
    """
    FEEDS = {
        "1h": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson",
        "24h": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson",
        "7d": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson",
        "30d": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson",
        "all": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
    }

    def __init__(self):
        poll_interval = int(os.getenv("USGS_POLL_INTERVAL", 60))
        super().__init__(name="USGS", default_poll_interval=poll_interval, requires_key=False)

    async def fetch_events(self, time_range: str = "24h", limit: int = 150) -> List[EarthEvent]:
        feed_url = self.FEEDS.get(time_range, self.FEEDS["24h"])
        response = await self._safe_http_get(feed_url, timeout_seconds=10.0)
        
        if not response:
            logger.warning("[USGS] Failed to retrieve live earthquake feed, returning cached events.")
            return self.last_events

        events: List[EarthEvent] = []
        try:
            data = response.json()
            features = data.get("features", [])

            for feat in features[:limit]:
                props = feat.get("properties", {})
                geom = feat.get("geometry", {})
                coords = geom.get("coordinates", [0, 0, 0])
                
                lon = float(coords[0])
                lat = float(coords[1])
                depth = float(coords[2]) if len(coords) > 2 else 0.0

                mag = float(props.get("mag")) if props.get("mag") is not None else None
                event_id = str(feat.get("id") or props.get("code") or "")
                
                # Determine severity and alert level
                if mag is not None:
                    if mag >= 7.0:
                        severity = DisasterSeverity.CRITICAL
                        alert = DisasterAlertLevel.RED
                    elif mag >= 6.0:
                        severity = DisasterSeverity.SEVERE
                        alert = DisasterAlertLevel.ORANGE
                    elif mag >= 4.5:
                        severity = DisasterSeverity.MAJOR
                        alert = DisasterAlertLevel.YELLOW
                    elif mag >= 2.5:
                        severity = DisasterSeverity.MODERATE
                        alert = DisasterAlertLevel.GREEN
                    else:
                        severity = DisasterSeverity.SMALL
                        alert = DisasterAlertLevel.WHITE
                else:
                    severity = DisasterSeverity.MODERATE
                    alert = DisasterAlertLevel.GREEN

                # Parse timestamps (epoch milliseconds -> ISO string)
                time_ms = props.get("time")
                updated_ms = props.get("updated")
                
                start_iso = datetime.fromtimestamp(time_ms / 1000.0, timezone.utc).isoformat() if time_ms else None
                updated_iso = datetime.fromtimestamp(updated_ms / 1000.0, timezone.utc).isoformat() if updated_ms else start_iso

                place = props.get("place") or "Unknown Location"
                country = place.split(",")[-1].strip() if "," in place else place

                event = EarthEvent(
                    id=f"dis-usgs-{event_id}",
                    source="USGS",
                    sources=["USGS"],
                    source_event_id=event_id,
                    type=DisasterType.EARTHQUAKE,
                    title=props.get("title") or f"M {mag or '?'} Earthquake - {place}",
                    description=f"Magnitude {mag or 'N/A'} earthquake at depth of {depth:.1f} km. Recorded by USGS Global Seismographic Network.",
                    latitude=lat,
                    longitude=lon,
                    magnitude=mag,
                    depth_km=depth,
                    severity=severity,
                    alert_level=alert,
                    confidence=0.98,
                    start_time=start_iso,
                    updated_time=updated_iso,
                    country=country,
                    region=place,
                    source_url=props.get("url") or f"https://earthquake.usgs.gov/earthquakes/eventpage/{event_id}",
                    geometry={
                        "type": "Point",
                        "coordinates": [lon, lat]
                    },
                    raw_source={
                        "status": props.get("status"),
                        "tsunami": props.get("tsunami"),
                        "sig": props.get("sig"),
                        "net": props.get("net"),
                        "nst": props.get("nst"),
                        "dmin": props.get("dmin"),
                        "rms": props.get("rms"),
                        "gap": props.get("gap"),
                        "magType": props.get("magType"),
                    }
                )
                events.append(event)

            self.last_events = events
            self.last_poll_time = datetime.now(timezone.utc)
            logger.info(f"[USGS] Successfully fetched and normalized {len(events)} earthquake events.")
            return events
        except Exception as e:
            self.last_error = f"Parsing error: {e}"
            logger.error(f"[USGS] Error parsing feed data: {e}")
            return self.last_events

usgs_provider = USGSDisasterProvider()
