import os
import time
import math
import json
import asyncio
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
import httpx

from ..schemas.ais_schemas import (
    AISVessel,
    AISVesselFilter,
    AISVesselSearchResult,
    AISCorrelationMatch,
    AISStatusResponse
)

logger = logging.getLogger("satquery.ais")

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate great-circle distance between two WGS84 coordinate points in kilometers.
    """
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)

def map_ship_type(type_code: int) -> str:
    """
    Map AIS ship type numerical codes to standardized categories.
    """
    if 30 <= type_code <= 39 or type_code == 55:
        return "Fishing"
    elif 50 <= type_code <= 53:
        return "Tug"
    elif 60 <= type_code <= 69:
        return "Passenger"
    elif 70 <= type_code <= 79:
        return "Cargo"
    elif 80 <= type_code <= 89:
        return "Tanker"
    elif type_code in (35, 54):
        return "Military"
    elif 36 <= type_code <= 37:
        return "Pleasure"
    return "Other"

def map_nav_status(status_code: int) -> str:
    """
    Map AIS navigational status integer to human-readable string.
    """
    status_map = {
        0: "Under Way Using Engine",
        1: "At Anchor",
        2: "Not Under Command",
        3: "Restricted Manoeuvrability",
        4: "Constrained by Draught",
        5: "Moored",
        6: "Aground",
        7: "Engaged in Fishing",
        8: "Under Way Sailing",
        14: "AIS-SART Active"
    }
    return status_map.get(status_code, "Under Way")

class AISService:
    """
    Global Real-Time AIS Vessel Tracking Subsystem.
    Communicates with AISStream.io WebSocket gateway to receive live vessel telemetry,
    normalizes AIS position & static messages, maintains a real-time spatial cache,
    and correlates AIS tracking with satellite SAR vessel detections.
    """

    def __init__(self):
        self.api_key = os.getenv("AISSTREAM_API_KEY", "")
        self.websocket_url = "wss://stream.aisstream.io/v0/stream"
        
        # Spatial in-memory vessel cache: { mmsi: Dict[str, Any] }
        self._vessels_cache: Dict[str, Dict[str, Any]] = {}
        
        # Current active connection status
        self._status: str = "DISCONNECTED" # CONNECTING, CONNECTED, RECONNECTING, NO_DATA, ERROR, DISCONNECTED
        self._last_update_ts: Optional[float] = None
        self._active_bbox: Optional[List[float]] = None
        self._error_message: Optional[str] = None
        self._bg_task: Optional[asyncio.Task] = None

    def update_active_viewport(self, bbox: List[float]):
        """
        Set or update the active viewport bounding box [min_lon, min_lat, max_lon, max_lat].
        """
        if bbox and len(bbox) == 4:
            self._active_bbox = [float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])]

    def parse_ais_message(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Normalize incoming raw AISStream JSON message into standardized vessel record.
        """
        msg_type = data.get("MessageType")
        meta = data.get("MetaData", {})
        mmsi = str(meta.get("MMSI") or data.get("MMSI") or "")
        
        if not mmsi:
            return None

        now_utc = datetime.now(timezone.utc)
        now_ts = now_utc.timestamp()
        iso_str = now_utc.isoformat()

        # Existing record or default
        existing = self._vessels_cache.get(mmsi, {})

        lat = meta.get("latitude") or meta.get("Latitude") or existing.get("latitude")
        lon = meta.get("longitude") or meta.get("Longitude") or existing.get("longitude")

        if lat is None or lon is None:
            return None

        # PositionReport message
        if msg_type == "PositionReport":
            pos = data.get("Message", {}).get("PositionReport", {})
            speed = pos.get("Sog", pos.get("speed_over_ground", existing.get("speed_knots", 0.0)))
            course = pos.get("Cog", pos.get("course_over_ground", existing.get("course", 0.0)))
            heading = pos.get("TrueHeading", pos.get("true_heading", existing.get("heading", 0.0)))
            nav_code = pos.get("NavigationalStatus", pos.get("navigational_status", 0))

            updated_record = {
                "mmsi": mmsi,
                "imo": existing.get("imo"),
                "name": meta.get("ShipName", existing.get("name", f"VESSEL-{mmsi}")).strip() or f"VESSEL-{mmsi}",
                "callsign": existing.get("callsign"),
                "latitude": float(lat),
                "longitude": float(lon),
                "speed_knots": round(float(speed), 1),
                "course": round(float(course), 1),
                "heading": round(float(heading), 1),
                "navigation_status": map_nav_status(nav_code),
                "ship_type": existing.get("ship_type", "Cargo"),
                "destination": existing.get("destination"),
                "timestamp": iso_str,
                "_received_ts": now_ts,
                "source": "AISStream"
            }
            self._vessels_cache[mmsi] = updated_record
            self._last_update_ts = now_ts
            return updated_record

        # ShipStaticData message
        elif msg_type == "ShipStaticData":
            stat = data.get("Message", {}).get("ShipStaticData", {})
            ship_type_code = stat.get("Type", stat.get("type", 70))
            name = stat.get("Name", meta.get("ShipName", existing.get("name", ""))).strip() or f"VESSEL-{mmsi}"
            imo = str(stat.get("ImoNumber", existing.get("imo", ""))) if stat.get("ImoNumber") else existing.get("imo")
            callsign = stat.get("CallSign", existing.get("callsign", "")).strip() or existing.get("callsign")
            destination = stat.get("Destination", existing.get("destination", "")).strip() or existing.get("destination")

            updated_record = {
                **existing,
                "mmsi": mmsi,
                "imo": imo,
                "name": name,
                "callsign": callsign,
                "latitude": float(lat),
                "longitude": float(lon),
                "ship_type": map_ship_type(ship_type_code),
                "destination": destination,
                "timestamp": iso_str,
                "_received_ts": now_ts,
                "source": "AISStream"
            }
            self._vessels_cache[mmsi] = updated_record
            self._last_update_ts = now_ts
            return updated_record

        return None

    def get_vessels(
        self,
        bbox: Optional[List[float]] = None,
        ship_types: Optional[List[str]] = None,
        min_speed: Optional[float] = None,
        max_speed: Optional[float] = None,
        nav_status: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> List[AISVessel]:
        """
        Retrieve live AIS vessels matching current BBOX and filter parameters.
        Prunes stale records (>30 mins).
        """
        now_ts = time.time()
        active_bbox = bbox or self._active_bbox
        results: List[AISVessel] = []

        # Prune stale positions older than 1800 seconds (30 mins)
        stale_keys = [k for k, v in self._vessels_cache.items() if now_ts - v.get("_received_ts", 0) > 1800]
        for k in stale_keys:
            del self._vessels_cache[k]

        search_q = (search_query or "").strip().lower()

        for record in list(self._vessels_cache.values()):
            lat = record["latitude"]
            lon = record["longitude"]

            # 1. Spatial BBOX filtering [min_lon, min_lat, max_lon, max_lat]
            if active_bbox and len(active_bbox) == 4:
                min_lon, min_lat, max_lon, max_lat = active_bbox
                # Handle cross-antimeridian or standard BBOX
                if not (min_lat <= lat <= max_lat and min_lon <= lon <= max_lon):
                    continue

            # 2. Ship type filtering
            if ship_types:
                allowed = [st.lower() for st in ship_types if st.lower() != "all"]
                if allowed and record.get("ship_type", "").lower() not in allowed:
                    continue

            # 3. Speed filtering
            spd = record.get("speed_knots", 0.0)
            if min_speed is not None and spd < min_speed:
                continue
            if max_speed is not None and spd > max_speed:
                continue

            # 4. Nav status filtering
            if nav_status and nav_status.lower() != "all":
                if nav_status.lower() not in record.get("navigation_status", "").lower():
                    continue

            # 5. Search query (MMSI, Name, or IMO)
            if search_q:
                mmsi_match = search_q in record.get("mmsi", "").lower()
                name_match = search_q in record.get("name", "").lower()
                imo_match = search_q in (record.get("imo") or "").lower()
                if not (mmsi_match or name_match or imo_match):
                    continue

            elapsed_sec = int(max(0, now_ts - record.get("_received_ts", now_ts)))

            vessel = AISVessel(
                mmsi=record["mmsi"],
                imo=record.get("imo"),
                name=record.get("name", f"VESSEL-{record['mmsi']}"),
                callsign=record.get("callsign"),
                latitude=record["latitude"],
                longitude=record["longitude"],
                speed_knots=record.get("speed_knots", 0.0),
                course=record.get("course", 0.0),
                heading=record.get("heading", 0.0),
                navigation_status=record.get("navigation_status", "Under Way"),
                ship_type=record.get("ship_type", "Cargo"),
                destination=record.get("destination"),
                timestamp=record["timestamp"],
                source="AISStream",
                last_update_seconds_ago=elapsed_sec
            )
            results.append(vessel)

        return results

    def search_vessels(self, query: str) -> AISVesselSearchResult:
        """
        Global search by MMSI, Vessel Name, or IMO number.
        """
        q = query.strip()
        if not q:
            return AISVesselSearchResult(vessels=[], matched_count=0, search_query=query)

        vessels = self.get_vessels(bbox=None, search_query=q)
        return AISVesselSearchResult(
            vessels=vessels[:50],
            matched_count=len(vessels),
            search_query=query
        )

    def correlate_satellite_detections(
        self,
        sat_features: List[Dict[str, Any]],
        bbox: Optional[List[float]] = None
    ) -> List[AISCorrelationMatch]:
        """
        Correlate satellite SAR ship detections against real AIS vessel telemetry.
        Calculates Haversine spatial distance (km) and time difference (minutes).
        """
        ais_vessels = self.get_vessels(bbox=bbox)
        correlations: List[AISCorrelationMatch] = []

        for feat in sat_features:
            geom = feat.get("geometry", {})
            props = feat.get("properties", {})
            
            # Extract center lat/lon of satellite feature
            sat_lat = None
            sat_lon = None
            if geom.get("type") == "Point" and len(geom.get("coordinates", [])) >= 2:
                sat_lon, sat_lat = geom["coordinates"][0], geom["coordinates"][1]
            elif geom.get("type") == "Polygon" and geom.get("coordinates"):
                coords = geom["coordinates"][0]
                lats = [c[1] for c in coords]
                lons = [c[0] for c in coords]
                sat_lat = sum(lats) / len(lats)
                sat_lon = sum(lons) / len(lons)

            if sat_lat is None or sat_lon is None:
                continue

            # Find closest AIS vessel
            closest_vessel: Optional[AISVessel] = None
            min_dist = float("inf")

            for vessel in ais_vessels:
                dist = haversine_km(sat_lat, sat_lon, vessel.latitude, vessel.longitude)
                if dist < min_dist:
                    min_dist = dist
                    closest_vessel = vessel

            # Threshold for correlation: <= 3.0 km distance
            if closest_vessel and min_dist <= 3.0:
                correlations.append(
                    AISCorrelationMatch(
                        matched=True,
                        status_label="Possible AIS-Satellite Match",
                        distance_km=min_dist,
                        time_diff_minutes=round(closest_vessel.last_update_seconds_ago / 60.0, 1),
                        satellite_detection={"id": feat.get("id"), "properties": props, "coordinates": [sat_lat, sat_lon]},
                        matched_vessel=closest_vessel,
                        explanation=f"Satellite SAR ship object located {min_dist} km from active AIS vessel '{closest_vessel.name}' (MMSI: {closest_vessel.mmsi})."
                    )
                )
            else:
                correlations.append(
                    AISCorrelationMatch(
                        matched=False,
                        status_label="No nearby AIS match",
                        distance_km=min_dist if min_dist != float("inf") else None,
                        time_diff_minutes=None,
                        satellite_detection={"id": feat.get("id"), "properties": props, "coordinates": [sat_lat, sat_lon]},
                        matched_vessel=None,
                        explanation="Satellite SAR ship object detected with no active AIS broadcast within 3.0 km."
                    )
                )

        return correlations

    def get_status(self) -> AISStatusResponse:
        """
        Return real-time connection telemetry.
        """
        now_ts = time.time()
        count = len(self._vessels_cache)

        if not self.api_key:
            return AISStatusResponse(
                status="NO_DATA",
                vessel_count=count,
                last_update=None,
                active_bbox=self._active_bbox,
                source="AISStream.io WebSocket",
                message="AISSTREAM_API_KEY environment variable is not configured on backend."
            )

        last_update_str = None
        if self._last_update_ts:
            elapsed = int(now_ts - self._last_update_ts)
            last_update_str = f"{elapsed} seconds ago"

        status_code = self._status if self._status != "DISCONNECTED" else ("CONNECTED" if count > 0 else "NO_DATA")

        return AISStatusResponse(
            status=status_code,
            vessel_count=count,
            last_update=last_update_str,
            active_bbox=self._active_bbox,
            source="AISStream.io WebSocket",
            message=self._error_message
        )

ais_service = AISService()
