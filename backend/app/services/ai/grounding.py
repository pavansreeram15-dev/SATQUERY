from ...utils.geo_utils import sanitize_bbox

def ground_bbox_to_features(bbox: list, features: list):
    sanitized = sanitize_bbox(bbox)
    return {"bbox": sanitized, "grounded_count": len(features)}
