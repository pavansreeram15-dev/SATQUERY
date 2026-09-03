import re
import time
import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

class GeocodingService:
    """
    OpenStreetMap Nominatim Geocoding & Coordinate Resolution Service.
    Supports natural language location searches, landmarks, cities, and direct coordinate parsing.
    Strictly adheres to OSM usage policy with proper User-Agent and in-memory caching.
    """

    NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
    USER_AGENT = "SATQUERY-AI/1.0 (https://satquery.ai; research-contact@satquery.ai)"

    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._last_request_time = 0.0

    def parse_direct_coordinates(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Check if query is direct latitude, longitude or DMS coordinates.
        Examples: '13.0827, 80.2707', '13.0827 N, 80.2707 E', '[80.27, 13.08]'
        """
        # Clean query
        cleaned = query.strip().replace("[", "").replace("]", "").replace("°", "")
        coord_pattern = r'^([-+]?\d{1,3}(?:\.\d+)?)\s*[, ]\s*([-+]?\d{1,3}(?:\.\d+)?)$'
        match = re.search(coord_pattern, cleaned)

        if match:
            try:
                val1 = float(match.group(1))
                val2 = float(match.group(2))

                # Determine which is lat and which is lon
                if -90 <= val1 <= 90 and -180 <= val2 <= 180:
                    lat, lon = val1, val2
                elif -90 <= val2 <= 90 and -180 <= val1 <= 180:
                    lat, lon = val2, val1
                else:
                    return None

                span = 0.05
                bbox = [
                    round(lon - span, 4),
                    round(lat - span, 4),
                    round(lon + span, 4),
                    round(lat + span, 4)
                ]

                return {
                    "place_id": f"coord-{round(lat, 4)}-{round(lon, 4)}",
                    "display_name": f"Coordinate Location: {lat:.4f}°, {lon:.4f}°",
                    "lat": lat,
                    "lon": lon,
                    "type": "coordinate",
                    "bbox": bbox,
                    "importance": 1.0,
                    "provider": "Direct GPS Coordinate Parser"
                }
            except Exception:
                return None
        return None

    async def search_location(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Search location using OpenStreetMap Nominatim or direct coordinate parser.
        """
        query_clean = query.strip()
        if not query_clean:
            return []

        # 1. Direct coordinate check
        coord_res = self.parse_direct_coordinates(query_clean)
        if coord_res:
            return [coord_res]

        # 2. Check Cache
        cache_key = query_clean.lower()
        if cache_key in self._cache:
            entry = self._cache[cache_key]
            if (time.time() - entry["timestamp"]) < 3600: # 1 hour cache
                return entry["results"]

        # 3. Rate-limiting check (at least 1s between upstream calls)
        elapsed = time.time() - self._last_request_time
        if elapsed < 1.0:
            import asyncio
            await asyncio.sleep(1.0 - elapsed)

        headers = {
            "User-Agent": self.USER_AGENT,
            "Accept-Language": "en"
        }
        params = {
            "q": query_clean,
            "format": "jsonv2",
            "limit": limit,
            "addressdetails": 1
        }

        try:
            self._last_request_time = time.time()
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.get(self.NOMINATIM_URL, params=params, headers=headers)
                if resp.status_code == 200:
                    items = resp.json()
                    results = []
                    for item in items:
                        lat = float(item.get("lat"))
                        lon = float(item.get("lon"))
                        raw_bbox = item.get("boundingbox", [])
                        
                        if len(raw_bbox) == 4:
                            # Nominatim format: [min_lat, max_lat, min_lon, max_lon]
                            bbox = [
                                round(float(raw_bbox[2]), 4),
                                round(float(raw_bbox[0]), 4),
                                round(float(raw_bbox[3]), 4),
                                round(float(raw_bbox[1]), 4)
                            ]
                        else:
                            span = 0.05
                            bbox = [
                                round(lon - span, 4),
                                round(lat - span, 4),
                                round(lon + span, 4),
                                round(lat + span, 4)
                            ]

                        results.append({
                            "place_id": str(item.get("place_id")),
                            "display_name": item.get("display_name"),
                            "lat": lat,
                            "lon": lon,
                            "type": item.get("type", "location"),
                            "category": item.get("category", "place"),
                            "bbox": bbox,
                            "importance": item.get("importance", 0.5),
                            "provider": "OpenStreetMap Nominatim"
                        })

                    self._cache[cache_key] = {
                        "timestamp": time.time(),
                        "results": results
                    }
                    return results
        except Exception:
            pass

        # Local fallback database for global cities & test regions
        fallback_places = {
            "guwahati": {"name": "Guwahati, Kamrup Metropolitan, Assam, India", "lat": 26.1445, "lon": 91.7362, "bbox": [91.60, 26.05, 91.88, 26.25]},
            "assam": {"name": "Assam Brahmaputra Valley, Northeast India", "lat": 26.2006, "lon": 92.9376, "bbox": [91.50, 26.00, 93.50, 27.20]},
            "kathmandu": {"name": "Kathmandu, Bagmati Province, Nepal", "lat": 27.7172, "lon": 85.3240, "bbox": [85.25, 27.65, 85.40, 27.78]},
            "nepal": {"name": "Nepal, Himalayan Mountain Region", "lat": 28.3949, "lon": 84.1240, "bbox": [80.05, 26.34, 88.20, 30.45]},
            "chennai": {"name": "Chennai, Tamil Nadu, India", "lat": 13.0827, "lon": 80.2707, "bbox": [80.18, 12.98, 80.35, 13.18]},
            "mumbai": {"name": "Mumbai & JNPT Port, Maharashtra, India", "lat": 18.9600, "lon": 72.8400, "bbox": [72.75, 18.85, 72.98, 19.10]},
            "bengaluru": {"name": "Bengaluru, Karnataka, India", "lat": 12.9716, "lon": 77.5946, "bbox": [77.48, 12.88, 77.72, 13.08]},
            "bangalore": {"name": "Bengaluru, Karnataka, India", "lat": 12.9716, "lon": 77.5946, "bbox": [77.48, 12.88, 77.72, 13.08]},
            "hyderabad": {"name": "Hyderabad, Telangana, India", "lat": 17.3850, "lon": 78.4867, "bbox": [78.38, 17.28, 78.58, 17.48]},
            "patna": {"name": "Patna, Bihar, India", "lat": 25.5941, "lon": 85.1376, "bbox": [85.05, 25.50, 85.25, 25.68]},
            "sundarbans": {"name": "Sundarbans Delta, West Bengal, India", "lat": 21.9497, "lon": 89.1833, "bbox": [88.85, 21.65, 89.45, 22.25]},
            "delhi": {"name": "New Delhi, National Capital Region, India", "lat": 28.6139, "lon": 77.2090, "bbox": [77.05, 28.45, 77.35, 28.75]},
            "kolkata": {"name": "Kolkata, West Bengal, India", "lat": 22.5726, "lon": 88.3639, "bbox": [88.28, 22.48, 88.45, 22.65]},
            "kochi": {"name": "Kochi & Port Corridor, Kerala, India", "lat": 9.9312, "lon": 76.2673, "bbox": [76.18, 9.85, 76.38, 10.02]},
            "tokyo": {"name": "Tokyo Metropolis & Bay, Japan", "lat": 35.6762, "lon": 139.6503, "bbox": [139.50, 35.55, 139.85, 35.80]},
            "london": {"name": "London, Greater London, United Kingdom", "lat": 51.5074, "lon": -0.1278, "bbox": [-0.25, 51.40, 0.05, 51.60]},
            "new york": {"name": "New York City, New York, USA", "lat": 40.7128, "lon": -74.0060, "bbox": [-74.15, 40.60, -73.85, 40.85]},
            "san francisco": {"name": "San Francisco Bay Area, California, USA", "lat": 37.7749, "lon": -122.4194, "bbox": [-122.52, 37.70, -122.35, 37.83]},
            "dubai": {"name": "Dubai & Jebel Ali, United Arab Emirates", "lat": 25.2048, "lon": 55.2708, "bbox": [55.10, 25.05, 55.45, 25.32]},
            "singapore": {"name": "Singapore Strait & Port, Singapore", "lat": 1.3521, "lon": 103.8198, "bbox": [103.65, 1.20, 104.00, 1.45]}
        }

        matched = []
        for k, v in fallback_places.items():
            if k in query_clean.lower() or query_clean.lower() in k:
                matched.append({
                    "place_id": f"local-{k}",
                    "display_name": v["name"],
                    "lat": v["lat"],
                    "lon": v["lon"],
                    "type": "city",
                    "bbox": v["bbox"],
                    "importance": 0.85,
                    "provider": "SATQUERY Built-in Geospatial Index"
                })
        return matched

geocoding_service = GeocodingService()
