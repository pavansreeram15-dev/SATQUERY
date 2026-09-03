import os
import time
import math
import json
import asyncio
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
import websockets

from ..schemas.ais_schemas import (
    AISVessel,
    AISVesselFilter,
    AISVesselSearchResult,
    AISCorrelationMatch,
    AISStatusResponse
)

logger = logging.getLogger("satquery.ais")
logger.setLevel(logging.INFO)

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

def map_ship_type(type_code: Optional[int]) -> str:
    """
    Map AIS ship type numerical codes to standardized categories.
    """
    if type_code is None:
        return "Other"
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

def map_nav_status(status_code: Optional[int]) -> str:
    """
    Map AIS navigational status integer to human-readable string.
    """
    if status_code is None:
        return "Under Way"
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
        
        # Connection status: CONNECTING, CONNECTED, RECONNECTING, NO_DATA, ERROR, DISCONNECTED
        self._status: str = "DISCONNECTED"
        self._last_update_ts: Optional[float] = None
        self._active_bbox: Optional[List[float]] = None
        self._error_message: Optional[str] = None
        
        # Async tasks & WebSocket handles
        self._bg_task: Optional[asyncio.Task] = None
        self._ws_client = None
        self._subscription_lock = asyncio.Lock()

    def ensure_started(self):
        """
        Ensure background WebSocket poller is running if event loop exists.
        """
        if self._bg_task is None or self._bg_task.done():
            try:
                loop = asyncio.get_running_loop()
                self._bg_task = loop.create_task(self._websocket_listener_loop())
                logger.info("[AIS] Background WebSocket task initialized.")
            except RuntimeError:
                logger.warning("[AIS] No running asyncio loop available for AIS background worker.")

    def update_active_viewport(self, bbox: List[float]):
        """
        Set or update active viewport bounding box [min_lon, min_lat, max_lon, max_lat].
        Triggers a subscription update if WebSocket is active.
        """
        if bbox and len(bbox) == 4:
            new_bbox = [float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])]
            old_bbox = self._active_bbox
            self._active_bbox = new_bbox
            
            logger.info(f"[AIS] Updated active viewport BBOX: {new_bbox}")
            
            # Re-subscribe if BBOX changed significantly
            if old_bbox != new_bbox and self._ws_client and self._status == "CONNECTED":
                try:
                    loop = asyncio.get_running_loop()
                    loop.create_task(self._send_subscription(self._ws_client))
                except Exception as e:
                    logger.debug(f"[AIS] Re-subscription schedule error: {e}")

    async def _send_subscription(self, ws):
        """
        Send AISStream.io subscription JSON payload over WebSocket.
        Format for AISStream: BoundingBoxes: [[[south_lat, west_lon], [north_lat, east_lon]]]
        """
        if not self.api_key:
            logger.warning("[AIS] AISSTREAM_API_KEY environment variable is missing. Cannot send subscription.")
            self._status = "NO_DATA"
            self._error_message = "AISSTREAM_API_KEY is not configured on backend."
            return

        async with self._subscription_lock:
            if self._active_bbox and len(self._active_bbox) == 4:
                min_lon, min_lat, max_lon, max_lat = self._active_bbox
                # Clamp coordinates to valid range
                min_lat = max(-90.0, min(-89.0, min_lat)) if min_lat < -90 else min_lat
                max_lat = min(90.0, max(89.0, max_lat)) if max_lat > 90 else max_lat
                min_lon = max(-180.0, min(-179.0, min_lon)) if min_lon < -180 else min_lon
                max_lon = min(180.0, max(179.0, max_lon)) if max_lon > 180 else max_lon
                
                boxes = [[[min_lat, min_lon], [max_lat, max_lon]]]
            else:
                # Default global / strategic corridor coverage if BBOX not yet specified by frontend
                boxes = [[[-90.0, -180.0], [90.0, 180.0]]]

            sub_msg = {
                "APIKey": self.api_key,
                "BoundingBoxes": boxes,
                "FilterMessageTypes": [
                    "PositionReport",
                    "StandardClassBPositionReport",
                    "ExtendedClassBPositionReport",
                    "ShipStaticData",
                    "ClassBStaticData"
                ]
            }

            try:
                await ws.send(json.dumps(sub_msg))
                logger.info(f"[AIS] Subscription sent successfully for BBOX: {boxes}")
            except Exception as e:
                logger.error(f"[AIS] Failed to send subscription message: {e}")

    async def _websocket_listener_loop(self):
        """
        Continuous background worker handling WebSocket connection, re-subscriptions, and reconnects.
        """
        retry_delay = 3
        while True:
            if not self.api_key:
                self._status = "NO_DATA"
                self._error_message = "AISSTREAM_API_KEY is not configured on backend."
                logger.info("[AIS] AISSTREAM_API_KEY is not configured. Waiting 15s...")
                await asyncio.sleep(15)
                self.api_key = os.getenv("AISSTREAM_API_KEY", "")
                continue

            try:
                self._status = "CONNECTING"
                logger.info(f"[AIS] Connecting to AISStream WebSocket: {self.websocket_url}...")
                
                async with websockets.connect(
                    self.websocket_url,
                    ping_interval=20,
                    ping_timeout=20,
                    close_timeout=10
                ) as ws:
                    self._ws_client = ws
                    self._status = "CONNECTED"
                    self._error_message = None
                    retry_delay = 3
                    logger.info("[AIS] Connected to AISStream WebSocket successfully.")
                    
                    # Send initial subscription message
                    await self._send_subscription(ws)

                    async for msg_str in ws:
                        try:
                            msg_json = json.loads(msg_str)
                            parsed = self.parse_ais_message(msg_json)
                            if parsed:
                                self._status = "CONNECTED"
                        except Exception as parse_err:
                            logger.debug(f"[AIS] JSON parse warning: {parse_err}")

            except (websockets.ConnectionClosed, websockets.WebSocketException) as ws_err:
                self._status = "RECONNECTING"
                self._ws_client = None
                self._error_message = f"WebSocket disconnected: {ws_err}"
                logger.warning(f"[AIS] WebSocket connection lost ({ws_err}). Reconnecting in {retry_delay}s...")
            except Exception as ex:
                self._status = "ERROR"
                self._ws_client = None
                self._error_message = f"AISStream exception: {ex}"
                logger.error(f"[AIS] Connection error: {ex}. Retrying in {retry_delay}s...")

            await asyncio.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, 30)

    def parse_ais_message(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Normalize incoming raw AISStream JSON message into standardized vessel record.
        Handles PositionReport, StandardClassBPositionReport, ExtendedClassBPositionReport,
        ShipStaticData, and ClassBStaticData.
        """
        msg_type = data.get("MessageType")
        meta = data.get("MetaData", {})
        mmsi_val = meta.get("MMSI") or data.get("MMSI") or meta.get("mmsi")
        
        if not mmsi_val:
            return None

        mmsi = str(mmsi_val)
        now_utc = datetime.now(timezone.utc)
        now_ts = now_utc.timestamp()
        iso_str = now_utc.isoformat()

        # Existing record in cache or blank default
        existing = self._vessels_cache.get(mmsi, {})

        # Extract coordinates from MetaData or Message payload
        lat = meta.get("latitude") if meta.get("latitude") is not None else meta.get("Latitude")
        lon = meta.get("longitude") if meta.get("longitude") is not None else meta.get("Longitude")

        msg_body = data.get("Message", {})
        pos_data = (
            msg_body.get("PositionReport") or
            msg_body.get("StandardClassBPositionReport") or
            msg_body.get("ExtendedClassBPositionReport") or
            {}
        )

        if lat is None:
            lat = pos_data.get("Latitude") if pos_data.get("Latitude") is not None else pos_data.get("latitude")
        if lon is None:
            lon = pos_data.get("Longitude") if pos_data.get("Longitude") is not None else pos_data.get("longitude")

        if lat is None or lon is None:
            lat = existing.get("latitude")
            lon = existing.get("longitude")

        # Validate coordinate range
        if lat is None or lon is None:
            return None

        try:
            lat = float(lat)
            lon = float(lon)
            if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
                return None
        except (ValueError, TypeError):
            return None

        ship_name = (
            meta.get("ShipName") or
            meta.get("ship_name") or
            existing.get("name") or
            f"VESSEL-{mmsi}"
        )
        ship_name = str(ship_name).strip() or f"VESSEL-{mmsi}"

        # 1. Position Report Message Types
        if msg_type in ("PositionReport", "StandardClassBPositionReport", "ExtendedClassBPositionReport") or pos_data:
            speed = pos_data.get("Sog", pos.get_speed if hasattr(pos_data, "get_speed") else pos_data.get("speed_over_ground", existing.get("speed_knots", 0.0)))
            course = pos_data.get("Cog", pos_data.get("course_over_ground", existing.get("course", 0.0)))
            heading = pos_data.get("TrueHeading", pos_data.get("true_heading", existing.get("heading", 0.0)))
            nav_code = pos_data.get("NavigationalStatus", pos_data.get("navigational_status"))

            updated_record = {
                "mmsi": mmsi,
                "imo": existing.get("imo"),
                "name": ship_name,
                "callsign": existing.get("callsign"),
                "latitude": lat,
                "longitude": lon,
                "speed_knots": round(float(speed or 0.0), 1),
                "course": round(float(course or 0.0), 1),
                "heading": round(float(heading or 0.0), 1),
                "navigation_status": map_nav_status(nav_code) if nav_code is not None else existing.get("navigation_status", "Under Way"),
                "ship_type": existing.get("ship_type", "Cargo"),
                "destination": existing.get("destination"),
                "timestamp": iso_str,
                "_received_ts": now_ts,
                "source": "AISStream"
            }
            self._vessels_cache[mmsi] = updated_record
            self._last_update_ts = now_ts
            logger.info(f"[AIS] Normalized position: {ship_name} (MMSI: {mmsi}) at ({lat:.4f}, {lon:.4f}). Cache count: {len(self._vessels_cache)}")
            return updated_record

        # 2. Static Metadata Message Types
        elif msg_type in ("ShipStaticData", "ClassBStaticData"):
            stat_data = msg_body.get("ShipStaticData") or msg_body.get("ClassBStaticData") or {}
            type_code = stat_data.get("Type", stat_data.get("type"))
            name = stat_data.get("Name", ship_name).strip() or ship_name
            imo_val = stat_data.get("ImoNumber", existing.get("imo"))
            imo = str(imo_val) if imo_val else None
            callsign = (stat_data.get("CallSign") or existing.get("callsign") or "").strip() or None
            destination = (stat_data.get("Destination") or existing.get("destination") or "").strip() or None

            updated_record = {
                **existing,
                "mmsi": mmsi,
                "imo": imo,
                "name": name,
                "callsign": callsign,
                "latitude": lat,
                "longitude": lon,
                "ship_type": map_ship_type(type_code) if type_code is not None else existing.get("ship_type", "Cargo"),
                "destination": destination,
                "timestamp": iso_str,
                "_received_ts": now_ts,
                "source": "AISStream"
            }
            self._vessels_cache[mmsi] = updated_record
            self._last_update_ts = now_ts
            logger.debug(f"[AIS] Normalized static metadata for {name} ({mmsi})")
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
        self.ensure_started()

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

        logger.info(f"[AIS] Returned {len(results)} vessels for BBOX: {active_bbox}")
        return results

    def search_vessels(self, query: str) -> AISVesselSearchResult:
        """
        Global search by MMSI, Vessel Name, or IMO number across stored live AIS data.
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

            closest_vessel: Optional[AISVessel] = None
            min_dist = float("inf")

            for vessel in ais_vessels:
                dist = haversine_km(sat_lat, sat_lon, vessel.latitude, vessel.longitude)
                if dist < min_dist:
                    min_dist = dist
                    closest_vessel = vessel

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
        self.ensure_started()

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
        msg = self._error_message
        if status_code == "CONNECTED":
            if count > 0:
                msg = f"AIS CONNECTED. {count} live vessels in spatial cache."
            else:
                msg = "AIS CONNECTED. Listening for vessels in active viewport..."

        return AISStatusResponse(
            status=status_code,
            vessel_count=count,
            last_update=last_update_str,
            active_bbox=self._active_bbox,
            source="AISStream.io WebSocket",
            message=msg
        )

ais_service = AISService()
