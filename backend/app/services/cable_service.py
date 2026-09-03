import time
import logging
from typing import Dict, Any, List, Optional
import httpx

from ..schemas.cable_schemas import (
    SubmarineCableFeature,
    SubmarineCableCollection,
    SubmarineCableDetail,
    LandingPointFeature,
    LandingPointCollection,
    CableProperties,
    LandingPointProperties
)

logger = logging.getLogger("satquery.cables")

ATTRIBUTION_TEXT = "Data: Gigawatt Map / TeleGeography — CC BY-NC-SA 3.0, non-commercial use"

def is_point_in_bbox(lon: float, lat: float, bbox: List[float]) -> bool:
    """Check if a coordinate point [lon, lat] is within bounding box [min_lon, min_lat, max_lon, max_lat]."""
    if not bbox or len(bbox) != 4:
        return True
    min_lon, min_lat, max_lon, max_lat = bbox
    return (min_lat <= lat <= max_lat) and (min_lon <= lon <= max_lon)

def is_geometry_in_bbox(geometry: Dict[str, Any], bbox: List[float]) -> bool:
    """Check if LineString or MultiLineString geometry overlaps bounding box."""
    if not bbox or len(bbox) != 4:
        return True
    gtype = geometry.get("type")
    coords = geometry.get("coordinates", [])

    if gtype == "LineString":
        for pt in coords:
            if len(pt) >= 2 and is_point_in_bbox(pt[0], pt[1], bbox):
                return True
    elif gtype == "MultiLineString":
        for line in coords:
            for pt in line:
                if len(pt) >= 2 and is_point_in_bbox(pt[0], pt[1], bbox):
                    return True
    elif gtype == "Point" and len(coords) >= 2:
        return is_point_in_bbox(coords[0], coords[1], bbox)

    return False

class CableService:
    """
    Submarine Cable Infrastructure Telemetry Subsystem.
    Proxies and caches global submarine cable routes & landing point GeoJSON
    from Gigawatt Map & TeleGeography open datasets (CC BY-NC-SA 3.0).
    """

    def __init__(self):
        self.gigawatt_base_url = "https://api.gigawattmap.com"
        self.fallback_base_url = "https://www.submarinecablemap.com/api/v3"
        
        # In-memory spatial caches (TTL: 24 hours = 86400 seconds)
        self._cables_cache: Optional[List[Dict[str, Any]]] = None
        self._landing_cache: Optional[List[Dict[str, Any]]] = None
        self._cables_cache_ts: float = 0.0
        self._landing_cache_ts: float = 0.0
        self._cable_details_cache: Dict[str, Dict[str, Any]] = {}

    async def _fetch_cables_geojson(self) -> List[Dict[str, Any]]:
        """
        Fetch global submarine cables GeoJSON with in-memory caching and fallback.
        """
        now = time.time()
        if self._cables_cache and (now - self._cables_cache_ts < 86400):
            return self._cables_cache

        urls = [
            f"{self.gigawatt_base_url}/cables-geo.json",
            f"{self.fallback_base_url}/cable/cable-geo.json"
        ]

        headers = {"User-Agent": "SATQUERY-AI/1.0 (EarthIntelligencePlatform)"}

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            for url in urls:
                try:
                    res = await client.get(url, headers=headers)
                    if res.status_code == 200:
                        data = res.json()
                        features = data.get("features", [])
                        if features:
                            self._cables_cache = features
                            self._cables_cache_ts = now
                            logger.info(f"[Cables] Loaded {len(features)} global submarine cable features from {url}")
                            return features
                except Exception as e:
                    logger.warning(f"[Cables] Failed to fetch cables GeoJSON from {url}: {e}")

        if self._cables_cache:
            return self._cables_cache

        return []

    async def _fetch_landing_points_geojson(self) -> List[Dict[str, Any]]:
        """
        Fetch global landing points GeoJSON with in-memory caching and fallback.
        """
        now = time.time()
        if self._landing_cache and (now - self._landing_cache_ts < 86400):
            return self._landing_cache

        urls = [
            f"{self.gigawatt_base_url}/landing-point-geo.json",
            f"{self.fallback_base_url}/landing-point/landing-point-geo.json"
        ]

        headers = {"User-Agent": "SATQUERY-AI/1.0 (EarthIntelligencePlatform)"}

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            for url in urls:
                try:
                    res = await client.get(url, headers=headers)
                    if res.status_code == 200:
                        data = res.json()
                        features = data.get("features", [])
                        if features:
                            self._landing_cache = features
                            self._landing_cache_ts = now
                            logger.info(f"[LandingPoints] Loaded {len(features)} global landing point markers from {url}")
                            return features
                except Exception as e:
                    logger.warning(f"[LandingPoints] Failed to fetch landing points from {url}: {e}")

        if self._landing_cache:
            return self._landing_cache

        return []

    async def get_cables(self, bbox: Optional[List[float]] = None) -> SubmarineCableCollection:
        """
        Retrieve submarine cable GeoJSON features matching BBOX.
        """
        raw_features = await self._fetch_cables_geojson()
        filtered_features: List[SubmarineCableFeature] = []

        for feat in raw_features:
            geom = feat.get("geometry", {})
            props = feat.get("properties", {})
            
            if is_geometry_in_bbox(geom, bbox):
                cable_feat = SubmarineCableFeature(
                    type="Feature",
                    geometry=geom,
                    properties=CableProperties(
                        id=str(props.get("id", "cable")),
                        name=str(props.get("name", "Submarine Cable")),
                        color=props.get("color", "#06b6d4"),
                        feature_id=props.get("feature_id"),
                        owners=props.get("owners"),
                        length=props.get("length"),
                        rfs=props.get("rfs"),
                        rfs_year=props.get("rfs_year"),
                        is_planned=props.get("is_planned", False),
                        source=ATTRIBUTION_TEXT
                    )
                )
                filtered_features.append(cable_feat)

        return SubmarineCableCollection(
            features=filtered_features,
            total_count=len(filtered_features),
            bbox_filtered=bool(bbox and len(bbox) == 4),
            attribution=ATTRIBUTION_TEXT
        )

    async def get_landing_points(self, bbox: Optional[List[float]] = None) -> LandingPointCollection:
        """
        Retrieve landing point GeoJSON markers matching BBOX.
        """
        raw_features = await self._fetch_landing_points_geojson()
        filtered_features: List[LandingPointFeature] = []

        for feat in raw_features:
            geom = feat.get("geometry", {})
            props = feat.get("properties", {})

            if is_geometry_in_bbox(geom, bbox):
                lp_feat = LandingPointFeature(
                    type="Feature",
                    geometry=geom,
                    properties=LandingPointProperties(
                        id=str(props.get("id", "lp")),
                        name=str(props.get("name", "Landing Point")),
                        country=props.get("country"),
                        is_tbd=props.get("is_tbd", False),
                        source=ATTRIBUTION_TEXT
                    )
                )
                filtered_features.append(lp_feat)

        return LandingPointCollection(
            features=filtered_features,
            total_count=len(filtered_features),
            bbox_filtered=bool(bbox and len(bbox) == 4),
            attribution=ATTRIBUTION_TEXT
        )

    async def get_cable_detail(self, cable_id: str) -> Optional[SubmarineCableDetail]:
        """
        Retrieve detailed metadata for a specific submarine cable by ID.
        """
        cid = cable_id.strip().lower()
        if cid in self._cable_details_cache:
            data = self._cable_details_cache[cid]
            return SubmarineCableDetail(**data, attribution=ATTRIBUTION_TEXT)

        url = f"{self.fallback_base_url}/cable/{cid}.json"
        headers = {"User-Agent": "SATQUERY-AI/1.0 (EarthIntelligencePlatform)"}

        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            try:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    self._cable_details_cache[cid] = data
                    return SubmarineCableDetail(
                        id=data.get("id", cid),
                        name=data.get("name", cid.upper()),
                        length=data.get("length"),
                        landing_points=data.get("landing_points", []),
                        owners=data.get("owners"),
                        suppliers=data.get("suppliers"),
                        rfs=data.get("rfs"),
                        rfs_year=data.get("rfs_year"),
                        is_planned=data.get("is_planned", False),
                        url=data.get("url"),
                        notes=data.get("notes"),
                        attribution=ATTRIBUTION_TEXT
                    )
            except Exception as e:
                logger.warning(f"[Cables] Detail fetch failed for cable '{cid}': {e}")

        return None

    async def search_cables(self, query: str) -> Dict[str, Any]:
        """
        Search submarine cables and landing points by name, country, or owner.
        """
        q = query.strip().lower()
        if not q:
            return {"cables": [], "landing_points": [], "total_count": 0, "query": query}

        cables_raw = await self._fetch_cables_geojson()
        landing_raw = await self._fetch_landing_points_geojson()

        matched_cables = []
        for feat in cables_raw:
            props = feat.get("properties", {})
            name = str(props.get("name", "")).lower()
            cid = str(props.get("id", "")).lower()
            owners = str(props.get("owners", "")).lower()
            if q in name or q in cid or q in owners:
                matched_cables.append({
                    "id": props.get("id"),
                    "name": props.get("name"),
                    "color": props.get("color", "#06b6d4"),
                    "owners": props.get("owners"),
                    "length": props.get("length"),
                    "coordinates": props.get("coordinates")
                })
                if len(matched_cables) >= 20:
                    break

        matched_lp = []
        for feat in landing_raw:
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            name = str(props.get("name", "")).lower()
            cid = str(props.get("id", "")).lower()
            country = str(props.get("country", "")).lower()
            if q in name or q in cid or q in country:
                matched_lp.append({
                    "id": props.get("id"),
                    "name": props.get("name"),
                    "country": props.get("country"),
                    "coordinates": geom.get("coordinates")
                })
                if len(matched_lp) >= 20:
                    break

        return {
            "cables": matched_cables,
            "landing_points": matched_lp,
            "total_count": len(matched_cables) + len(matched_lp),
            "query": query,
            "attribution": ATTRIBUTION_TEXT
        }

cable_service = CableService()
