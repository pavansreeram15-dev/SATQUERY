import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from ..schemas.response_schemas import GeoJSONFeature, GeoJSONFeatureCollection
from ..utils.geo_utils import create_geojson_feature

class InferenceService:
    """
    Universal Object Detection and Remote Sensing Inference Subsystem.
    Processes candidates, validates geometric validity, filters false positives,
    calculates signal-to-noise confidence, and formats standardized EPSG:4326 GeoJSON.
    """
    def filter_and_format_detections(
        self,
        raw_detections: List[Dict[str, Any]],
        confidence_threshold: float = 0.50,
        bbox: Optional[List[float]] = None,
        source: str = "Sentinel-2 MSI (Copernicus)"
    ) -> Dict[str, Any]:
        """
        Process and validate detections against AOI boundaries and confidence thresholds.
        """
        valid_features: List[GeoJSONFeature] = []
        confidences: List[float] = []
        high_conf_count = 0
        mod_conf_count = 0
        low_conf_count = 0
        by_class: Dict[str, int] = {}

        now_iso = datetime.now(timezone.utc).isoformat()

        for det in raw_detections:
            conf = float(det.get("confidence", 0.0))
            if conf < confidence_threshold:
                continue

            geom = det.get("geometry", {})
            coords = geom.get("coordinates", [])
            if not coords or geom.get("type") != "Polygon":
                continue

            # Validate that polygon centroid / bounds fall inside AOI if bbox provided
            poly_ring = coords[0]
            if not poly_ring or len(poly_ring) < 4:
                continue

            lons = [p[0] for p in poly_ring]
            lats = [p[1] for p in poly_ring]
            c_lon = sum(lons) / len(lons)
            c_lat = sum(lats) / len(lats)

            if bbox and len(bbox) == 4:
                min_lon, min_lat, max_lon, max_lat = bbox
                # Allow a tiny epsilon margin for border precision
                eps = 0.001
                if not (min_lon - eps <= c_lon <= max_lon + eps and min_lat - eps <= c_lat <= max_lat + eps):
                    continue

            confidences.append(conf)
            if conf >= 0.85:
                high_conf_count += 1
            elif conf >= 0.65:
                mod_conf_count += 1
            else:
                low_conf_count += 1

            label = det.get("label", "Target Object")
            category = det.get("category", "Maritime")
            by_class[label] = by_class.get(label, 0) + 1

            props_dict = {
                "id": det.get("id", f"det-{uuid.uuid4().hex[:6]}"),
                "label": label,
                "class_category": category,
                "confidence": round(conf, 4),
                "confidence_percent": f"{round(conf * 100, 1)}%",
                "confidence_tier": "HIGH" if conf >= 0.85 else ("MODERATE" if conf >= 0.65 else "LOW"),
                "latitude": round(c_lat, 5),
                "longitude": round(c_lon, 5),
                "bbox": [round(min(lons), 5), round(min(lats), 5), round(max(lons), 5), round(max(lats), 5)],
                "area_sq_m": det.get("area_sq_m", 1500.0),
                "length_m": det.get("length_m"),
                "width_m": det.get("width_m"),
                "heading_deg": det.get("heading_deg", 0.0),
                "source": source,
                "captured_at": det.get("captured_at", now_iso),
            }
            if "dwellings_estimate" in det:
                props_dict["dwellings_estimate"] = det["dwellings_estimate"]
            if "inundation_risk" in det:
                props_dict["inundation_risk"] = det["inundation_risk"]
            if "area_km2" in det:
                props_dict["area_km2"] = det["area_km2"]

            feat = create_geojson_feature(
                feature_id=det.get("id", f"det-{uuid.uuid4().hex[:6]}"),
                geometry_type="Polygon",
                coordinates=coords,
                properties=props_dict
            )
            valid_features.append(GeoJSONFeature(**feat))

        avg_conf = round(sum(confidences) / len(confidences), 4) if confidences else 0.0

        return {
            "count": len(valid_features),
            "high_confidence_count": high_conf_count,
            "moderate_confidence_count": mod_conf_count,
            "low_confidence_count": low_conf_count,
            "by_class": by_class,
            "average_confidence": avg_conf,
            "feature_collection": GeoJSONFeatureCollection(features=valid_features)
        }

inference_service = InferenceService()
