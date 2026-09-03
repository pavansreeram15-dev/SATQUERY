from typing import Dict, Any, List, Optional
from ..schemas.response_schemas import GeoJSONFeature, GeoJSONFeatureCollection
from ..utils.geo_utils import calculate_bbox_area_km2, create_geojson_feature

class ChangeDetectionService:
    """
    Temporal Differencing and Multi-year Earth Observation Change Pipeline.
    """
    def format_change_results(
        self,
        bbox: List[float],
        before_year: int,
        after_year: int,
        change_polygons: List[Dict[str, Any]],
        confidence: float = 0.918
    ) -> Dict[str, Any]:
        total_bbox_area_km2 = calculate_bbox_area_km2(bbox)
        
        total_changed_km2 = sum(p.get("area_km2", 1.2) for p in change_polygons)
        change_pct = round(min((total_changed_km2 / total_bbox_area_km2) * 100.0, 100.0), 2)
        
        features: List[GeoJSONFeature] = []
        breakdown: Dict[str, float] = {}

        for idx, poly in enumerate(change_polygons):
            c_type = poly.get("change_type", "New Construction")
            area = float(poly.get("area_km2", 1.0))
            breakdown[c_type] = round(breakdown.get(c_type, 0.0) + area, 2)

            feat = create_geojson_feature(
                feature_id=f"change-poly-{idx+1}",
                geometry_type="Polygon",
                coordinates=poly["coordinates"],
                properties={
                    "change_type": c_type,
                    "confidence": round(poly.get("confidence", confidence), 4),
                    "confidence_percent": f"{round(poly.get('confidence', confidence)*100, 1)}%",
                    "area_km2": area,
                    "before_year": before_year,
                    "after_year": after_year,
                    "intensity": poly.get("intensity", "High Conversion Rate")
                }
            )
            features.append(GeoJSONFeature(**feat))

        return {
            "before_year": before_year,
            "after_year": after_year,
            "total_area_km2": total_bbox_area_km2,
            "total_changed_km2": round(total_changed_km2, 2),
            "change_percentage": change_pct,
            "change_breakdown_km2": breakdown,
            "confidence": confidence,
            "feature_collection": GeoJSONFeatureCollection(features=features)
        }

change_detection_service = ChangeDetectionService()
