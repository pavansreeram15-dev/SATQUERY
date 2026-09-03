from .geo_utils import calculate_bbox_area_km2, sanitize_bbox

def format_bbox(bbox: list) -> str:
    if not bbox or len(bbox) != 4:
        return "Invalid BBOX"
    return f"[{bbox[1]:.4f}, {bbox[0]:.4f} to {bbox[3]:.4f}, {bbox[2]:.4f}]"

__all__ = ["calculate_bbox_area_km2", "sanitize_bbox", "format_bbox"]
