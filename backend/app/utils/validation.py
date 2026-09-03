from typing import List, Tuple

def validate_bbox(bbox: List[float]) -> Tuple[bool, str]:
    if not isinstance(bbox, list) or len(bbox) != 4:
        return False, "BBOX must be a list of 4 floats: [min_lon, min_lat, max_lon, max_lat]"
    min_lon, min_lat, max_lon, max_lat = bbox
    if not (-180 <= min_lon <= 180 and -180 <= max_lon <= 180):
        return False, "Longitude values must be between -180 and 180"
    if not (-90 <= min_lat <= 90 and -90 <= max_lat <= 90):
        return False, "Latitude values must be between -90 and 90"
    if min_lon >= max_lon or min_lat >= max_lat:
        return False, "Min coordinates must be strictly less than Max coordinates"
    return True, "Valid"
