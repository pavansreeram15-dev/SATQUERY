def build_feature(geometry: dict, properties: dict, feature_id: str = None) -> dict:
    feat = {
        "type": "Feature",
        "geometry": geometry,
        "properties": properties
    }
    if feature_id:
        feat["id"] = feature_id
    return feat

def build_feature_collection(features: list) -> dict:
    return {
        "type": "FeatureCollection",
        "features": features
    }
