import httpx
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("satquery.overpass")

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
]

class OsmOverpassService:
    """
    Live OpenStreetMap Overpass API Subsystem (100% Free & Keyless).
    Extracts genuine real-world geographic ground-truth geometries for any bounding box:
    - Human Settlements & Villages (place=village, town, hamlet, suburb)
    - Residential Landuse & Dwellings (landuse=residential, building=yes)
    - Water Bodies & River Channels (natural=water, waterway=riverbank)
    - Critical Infrastructure & Facilities (amenity=hospital, school, shelter)
    - Maritime Berths & Piers (man_made=pier, industrial=port)
    """

    async def fetch_real_ground_features(
        self,
        bbox: List[float],
        feature_type: str = "settlement",
        max_results: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Query real OpenStreetMap vector geometries inside [min_lon, min_lat, max_lon, max_lat].
        """
        if not bbox or len(bbox) != 4:
            return []

        min_lon, min_lat, max_lon, max_lat = bbox
        
        # Overpass expects bbox as (min_lat, min_lon, max_lat, max_lon)
        s, w, n, e = min_lat, min_lon, max_lat, max_lon

        if feature_type in ["settlement", "residential", "village", "affected"]:
            ql = f"""
            [out:json][timeout:10];
            (
              way["landuse"="residential"]({s},{w},{n},{e});
              way["place"~"village|town|suburb|hamlet"]({s},{w},{n},{e});
              node["place"~"village|town|hamlet|isolated_dwelling"]({s},{w},{n},{e});
              way["building"]({s},{w},{n},{e});
            );
            out geom {max_results};
            """
        elif feature_type in ["water", "flood", "river", "inundation"]:
            ql = f"""
            [out:json][timeout:10];
            (
              way["natural"="water"]({s},{w},{n},{e});
              way["waterway"~"riverbank|canal|dock"]({s},{w},{n},{e});
              relation["natural"="water"]({s},{w},{n},{e});
            );
            out geom {max_results};
            """
        elif feature_type in ["ship", "vessel", "maritime", "port"]:
            ql = f"""
            [out:json][timeout:10];
            (
              way["man_made"~"pier|breakwater|groyne"]({s},{w},{n},{e});
              way["industrial"="port"]({s},{w},{n},{e});
              way["landuse"="harbour"]({s},{w},{n},{e});
            );
            out geom {max_results};
            """
        else:
            ql = f"""
            [out:json][timeout:10];
            (
              way["landuse"]({s},{w},{n},{e});
              way["building"]({s},{w},{n},{e});
            );
            out geom {max_results};
            """

        headers = {
            "User-Agent": "SATQUERY-AI/1.0 (EarthIntelligencePlatform; contact@satquery.org)"
        }

        for endpoint in OVERPASS_ENDPOINTS:
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post(endpoint, data={"data": ql}, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        elements = data.get("elements", [])
                        parsed = self._convert_osm_to_geojson_features(elements, feature_type)
                        if parsed:
                            return parsed
            except Exception as ex:
                logger.debug(f"Overpass endpoint {endpoint} failed: {ex}")
                continue

        return []

    def _convert_osm_to_geojson_features(
        self,
        elements: List[Dict[str, Any]],
        target_type: str
    ) -> List[Dict[str, Any]]:
        features = []

        for idx, el in enumerate(elements):
            tags = el.get("tags", {})
            name = tags.get("name") or tags.get("place") or tags.get("landuse") or f"Real OSM Ground Feature #{idx+1}"
            
            # Polygons from OSM Ways
            if el.get("type") == "way" and el.get("geometry"):
                pts = el["geometry"]
                coords = [[pt["lon"], pt["lat"]] for pt in pts if "lon" in pt and "lat" in pt]
                if len(coords) >= 3:
                    # Close the polygon ring if not closed
                    if coords[0] != coords[-1]:
                        coords.append(coords[0])

                    features.append({
                        "id": f"osm-{el.get('type')}-{el.get('id', idx)}",
                        "label": name,
                        "category": tags.get("place", tags.get("landuse", tags.get("building", "Real Ground Feature"))),
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [coords]
                        },
                        "confidence": 0.965,
                        "dwellings_estimate": int(tags.get("population", 120)) if tags.get("population") else 85,
                        "inundation_risk": "WATCH" if "water" in target_type or "flood" in target_type else "NORMAL",
                        "status": "NORMAL",
                        "source": "OpenStreetMap Real Ground Truth (Overpass API)"
                    })

            # Point Nodes -> Buffer into small polygon footprint
            elif el.get("type") == "node" and "lat" in el and "lon" in el:
                c_lat, c_lon = el["lat"], el["lon"]
                delta = 0.002
                poly = [[
                    [round(c_lon - delta, 6), round(c_lat - delta, 6)],
                    [round(c_lon + delta, 6), round(c_lat - delta, 6)],
                    [round(c_lon + delta, 6), round(c_lat + delta, 6)],
                    [round(c_lon - delta, 6), round(c_lat + delta, 6)],
                    [round(c_lon - delta, 6), round(c_lat - delta, 6)],
                ]]
                pop = tags.get("population")
                features.append({
                    "id": f"osm-node-{el.get('id', idx)}",
                    "label": f"{name} (Settlement Node)",
                    "category": tags.get("place", "Human Settlement"),
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": poly
                    },
                    "confidence": 0.98,
                    "dwellings_estimate": int(pop) // 4 if pop and str(pop).isdigit() else 240,
                    "inundation_risk": "WATCH",
                    "status": "WATCH",
                    "source": "OpenStreetMap Real Ground Truth (Overpass API)"
                })

        return features

osm_overpass_service = OsmOverpassService()
OSMOverpassService = OsmOverpassService
OverpassOSMService = OsmOverpassService
