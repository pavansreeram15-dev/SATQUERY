import os
import csv
import io
import logging
from typing import List, Optional
from datetime import datetime, timezone
from .base_provider import BaseDisasterProvider
from ...schemas.disaster_schemas import EarthEvent, DisasterType, DisasterSeverity, DisasterAlertLevel

logger = logging.getLogger(__name__)

class FIRMSDisasterProvider(BaseDisasterProvider):
    """
    NASA FIRMS (Fire Information for Resource Management System) active fire provider adapter.
    Fetches satellite-detected thermal anomalies & Fire Radiative Power (FRP) from VIIRS and MODIS.
    """
    def __init__(self):
        poll_interval = int(os.getenv("FIRMS_POLL_INTERVAL", 600))
        super().__init__(name="FIRMS", default_poll_interval=poll_interval, requires_key=True)

    @property
    def map_key(self) -> str:
        return os.getenv("FIRMS_MAP_KEY", "").strip()

    def is_configured(self) -> bool:
        return bool(self.map_key and len(self.map_key) >= 16)

    async def fetch_events(self, time_range: str = "24h", limit: int = 150) -> List[EarthEvent]:
        if not self.is_configured():
            self.status = "UNCONFIGURED"
            self.last_error = "FIRMS_MAP_KEY unconfigured. Optional: Obtain free key from https://firms.modaps.eosdis.nasa.gov/api/map_key/"
            return self.last_events

        days = 1 if time_range in ["1h", "24h"] else (7 if time_range == "7d" else 10)
        # Using VIIRS S-NPP NRT Global Area Feed
        url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{self.map_key}/VIIRS_SNPP_NRT/world/{days}"
        
        response = await self._safe_http_get(url, timeout_seconds=15.0)
        if not response:
            return self.last_events

        events: List[EarthEvent] = []
        try:
            content_text = response.text
            reader = csv.DictReader(io.StringIO(content_text))

            count = 0
            for row in reader:
                if count >= limit:
                    break

                try:
                    lat = float(row.get("latitude", 0))
                    lon = float(row.get("longitude", 0))
                    frp = float(row.get("frp", 0)) if row.get("frp") else 0.0
                    brightness = float(row.get("bright_ti4", 0)) if row.get("bright_ti4") else 0.0
                    confidence_str = row.get("confidence", "nominal").lower()
                    
                    acq_date = row.get("acq_date", "")
                    acq_time = row.get("acq_time", "0000").zfill(4)
                    
                    time_iso = f"{acq_date}T{acq_time[:2]}:{acq_time[2:]}:00Z" if acq_date else datetime.now(timezone.utc).isoformat()
                    event_id = f"{lat:.3f}_{lon:.3f}_{acq_date}_{acq_time}"

                    # Severity calculation based on FRP (Fire Radiative Power in Megawatts)
                    if frp >= 100.0:
                        severity = DisasterSeverity.CRITICAL
                        alert = DisasterAlertLevel.RED
                    elif frp >= 40.0:
                        severity = DisasterSeverity.SEVERE
                        alert = DisasterAlertLevel.ORANGE
                    elif frp >= 15.0:
                        severity = DisasterSeverity.MAJOR
                        alert = DisasterAlertLevel.YELLOW
                    else:
                        severity = DisasterSeverity.MODERATE
                        alert = DisasterAlertLevel.GREEN

                    conf_val = 0.95 if confidence_str == "h" else (0.80 if confidence_str == "n" else 0.50)

                    event = EarthEvent(
                        id=f"dis-firms-{event_id}",
                        source="FIRMS",
                        sources=["FIRMS"],
                        source_event_id=event_id,
                        type=DisasterType.WILDFIRE,
                        title=f"Active Thermal Anomaly / Hotspot (FRP: {frp:.1f} MW)",
                        description=f"Satellite active wildfire detection (VIIRS S-NPP). Brightness: {brightness:.1f}K, Radiative Power: {frp:.1f} MW.",
                        latitude=lat,
                        longitude=lon,
                        magnitude=frp,
                        severity=severity,
                        alert_level=alert,
                        confidence=conf_val,
                        start_time=time_iso,
                        updated_time=time_iso,
                        source_url="https://firms.modaps.eosdis.nasa.gov/",
                        geometry={
                            "type": "Point",
                            "coordinates": [lon, lat]
                        },
                        raw_source={
                            "satellite": row.get("satellite", "VIIRS"),
                            "instrument": row.get("instrument", "VIIRS"),
                            "frp_mw": frp,
                            "daynight": row.get("daynight"),
                            "bright_ti4": brightness
                        }
                    )
                    events.append(event)
                    count += 1
                except Exception:
                    continue

            self.last_events = events
            self.last_poll_time = datetime.now(timezone.utc)
            logger.info(f"[FIRMS] Successfully parsed {len(events)} active thermal hotspot events.")
            return events
        except Exception as e:
            self.last_error = f"FIRMS parsing error: {e}"
            logger.error(f"[FIRMS] Error parsing CSV payload: {e}")
            return self.last_events

firms_provider = FIRMSDisasterProvider()
