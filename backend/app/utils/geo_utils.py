import math
from typing import List, Tuple, Dict, Any

def calculate_bbox_area_km2(bbox: List[float]) -> float:
    """
    Calculate approximate geodesic area in square kilometers for a WGS84 bounding box.
    bbox format: [min_lon, min_lat, max_lon, max_lat]
    """
    min_lon, min_lat, max_lon, max_lat = bbox
    # Mean latitude in radians
    mean_lat_rad = math.radians((min_lat + max_lat) / 2.0)
    
    # 1 degree of latitude ~ 111.139 km
    delta_lat_km = abs(max_lat - min_lat) * 111.139
    
    # 1 degree of longitude ~ 111.320 * cos(lat) km
    delta_lon_km = abs(max_lon - min_lon) * 111.320 * math.cos(mean_lat_rad)
    
    area = delta_lat_km * delta_lon_km
    return round(max(area, 0.001), 3)

def sanitize_bbox(bbox: List[float]) -> List[float]:
    """Sanitize and validate bbox coordinates [min_lon, min_lat, max_lon, max_lat]."""
    if not bbox or len(bbox) != 4:
        return [80.20, 13.00, 80.35, 13.15]
    min_lon, min_lat, max_lon, max_lat = bbox
    min_lon_c = max(-180.0, min(180.0, min_lon))
    max_lon_c = max(-180.0, min(180.0, max_lon))
    min_lat_c = max(-90.0, min(90.0, min_lat))
    max_lat_c = max(-90.0, min(90.0, max_lat))
    if min_lon_c >= max_lon_c:
        max_lon_c = min_lon_c + 0.01
    if min_lat_c >= max_lat_c:
        max_lat_c = min_lat_c + 0.01
    return [min_lon_c, min_lat_c, max_lon_c, max_lat_c]

def bbox_to_polygon_coordinates(bbox: List[float]) -> List[List[List[float]]]:
    """Convert [min_lon, min_lat, max_lon, max_lat] to GeoJSON Polygon coordinates."""
    min_lon, min_lat, max_lon, max_lat = bbox
    return [[
        [min_lon, min_lat],
        [max_lon, min_lat],
        [max_lon, max_lat],
        [min_lon, max_lat],
        [min_lon, min_lat]
    ]]

def is_point_in_bbox(lon: float, lat: float, bbox: List[float]) -> bool:
    """Check if point (lon, lat) lies within [min_lon, min_lat, max_lon, max_lat]."""
    return bbox[0] <= lon <= bbox[2] and bbox[1] <= lat <= bbox[3]

def is_valid_geojson_polygon(coordinates: Any) -> bool:
    """
    Validate that coordinates represent a valid GeoJSON polygon:
    - Must be a list of linear rings (each ring is a list of [lon, lat] pairs)
    - Each linear ring must have at least 4 positions
    - The first and last position must be equivalent (closed ring)
    """
    if not isinstance(coordinates, list) or len(coordinates) == 0:
        return False
    for ring in coordinates:
        if not isinstance(ring, list) or len(ring) < 4:
            return False
        if ring[0] != ring[-1]:
            return False
        for pt in ring:
            if not isinstance(pt, (list, tuple)) or len(pt) < 2:
                return False
            lon, lat = pt[0], pt[1]
            if not (-180.0 <= lon <= 180.0 and -90.0 <= lat <= 90.0):
                return False
    return True

def create_geojson_feature(
    feature_id: str,
    geometry_type: str,
    coordinates: Any,
    properties: Dict[str, Any]
) -> Dict[str, Any]:
    """Helper to generate standard WGS84 GeoJSON feature."""
    return {
        "type": "Feature",
        "id": feature_id,
        "geometry": {
            "type": geometry_type,
            "coordinates": coordinates
        },
        "properties": properties
    }

