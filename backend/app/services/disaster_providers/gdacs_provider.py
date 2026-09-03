import os
import logging
from typing import List, Optional
from datetime import datetime, timezone
from .base_provider import BaseDisasterProvider
from ...schemas.disaster_schemas import EarthEvent, DisasterType, DisasterSeverity, DisasterAlertLevel

logger = logging.getLogger(__name__)

GDACS_TYPE_MAP = {
    "EQ": DisasterType.EARTHQUAKE,
    "TC": DisasterType.CYCLONE,
    "FL": DisasterType.FLOOD,
    "VO": DisasterType.VOLCANO,
    "TS": DisasterType.TSUNAMI,
    "DR": DisasterType.DROUGHT,
    "WF": DisasterType.WILDFIRE
}

class GDACSDisasterProvider(BaseDisasterProvider):
    """
    GDACS (Global Disaster Alert and Coordination System) provider adapter.
    Fetches real-time multi-hazard alerts (Earthquakes, Tropical Cyclones, Floods, Tsunamis, Volcanoes).
    """
    API_URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH"

    def __init__(self):
        poll_interval = int(os.getenv("GDACS_POLL_INTERVAL", 300))
        super().__init__(name="GDACS", default_poll_interval=poll_interval, requires_key=False)

    async def fetch_events(self, time_range: str = "24h", limit: int = 100) -> List[EarthEvent]:
        params = {
            "eventtypes": "EQ,TC,FL,VO,DR,TS,WF",
            "limit": limit
        }
        
        response = await self._safe_http_get(self.API_URL, params=params, timeout_seconds=12.0)
        if not response:
            logger.warning("[GDACS] Failed to retrieve live GDACS alerts, returning cached events.")
            return self.last_events

        events: List[EarthEvent] = []
        try:
            data = response.json()
            features = data.get("features", [])

            for feat in features[:limit]:
                props = feat.get("properties", {})
                geom = feat.get("geometry", {})
                coords = geom.get("coordinates", [0, 0])
                
                lon = float(coords[0]) if len(coords) > 0 else 0.0
                lat = float(coords[1]) if len(coords) > 1 else 0.0

                event_id = str(props.get("eventid") or props.get("episodeid") or feat.get("id") or "")
                event_type_code = str(props.get("eventtype") or "").upper()
                disaster_type = GDACS_TYPE_MAP.get(event_type_code, DisasterType.OTHER)

                name = props.get("eventname") or props.get("name") or "Global Disaster Alert"
                description = props.get("description") or f"GDACS {event_type_code} multi-hazard alert."
                
                alert_score = str(props.get("alertlevel") or props.get("alertscore") or "green").lower()
                if "red" in alert_score:
                    alert = DisasterAlertLevel.RED
                    severity = DisasterSeverity.CRITICAL
                elif "orange" in alert_score:
                    alert = DisasterAlertLevel.ORANGE
                    severity = DisasterSeverity.SEVERE
                elif "yellow" in alert_score:
                    alert = DisasterAlertLevel.YELLOW
                    severity = DisasterSeverity.MAJOR
                else:
                    alert = DisasterAlertLevel.GREEN
                    severity = DisasterSeverity.MODERATE

                from_date = props.get("fromdate") or props.get("datemodified") or datetime.now(timezone.utc).isoformat()
                to_date = props.get("todate")
                country = props.get("country")
                
                raw_url = props.get("url")
                if isinstance(raw_url, dict):
                    url = raw_url.get("report") or raw_url.get("details") or raw_url.get("geometry") or f"https://www.gdacs.org/report.aspx?eventtype={event_type_code}&eventid={event_id}"
                elif isinstance(raw_url, str) and raw_url.strip():
                    url = raw_url
                else:
                    url = f"https://www.gdacs.org/report.aspx?eventtype={event_type_code}&eventid={event_id}"

                severity_val = props.get("severitydata", {}).get("severity") if isinstance(props.get("severitydata"), dict) else None

                event = EarthEvent(
                    id=f"dis-gdacs-{event_id}",
                    source="GDACS",
                    sources=["GDACS"],
                    source_event_id=event_id,
                    type=disaster_type,
                    title=f"{props.get('alertlevel', '').capitalize()} Alert: {name}",
                    description=description,
                    latitude=lat,
                    longitude=lon,
                    magnitude=float(severity_val) if severity_val is not None else None,
                    severity=severity,
                    alert_level=alert,
                    confidence=0.94,
                    start_time=from_date,
                    updated_time=props.get("datemodified") or from_date,
                    end_time=to_date,
                    country=country,
                    region=country,
                    source_url=url,
                    geometry={
                        "type": "Point",
                        "coordinates": [lon, lat]
                    },
                    raw_source={
                        "event_type_code": event_type_code,
                        "alert_score": alert_score,
                        "affected_countries": props.get("affectedcountries"),
                        "severity_unit": props.get("severitydata", {}).get("severityunit") if isinstance(props.get("severitydata"), dict) else None
                    }
                )
                events.append(event)

            self.last_events = events
            self.last_poll_time = datetime.now(timezone.utc)
            logger.info(f"[GDACS] Successfully fetched and normalized {len(events)} disaster events.")
            return events
        except Exception as e:
            self.last_error = f"Parsing error: {e}"
            logger.error(f"[GDACS] Error parsing GDACS payload: {e}")
            return self.last_events

gdacs_provider = GDACSDisasterProvider()
