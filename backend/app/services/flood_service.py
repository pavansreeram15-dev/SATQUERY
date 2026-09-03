import numpy as np
from typing import Dict, Any, List, Optional
from ..schemas.response_schemas import GeoJSONFeature, GeoJSONFeatureCollection
from ..utils.geo_utils import calculate_bbox_area_km2, create_geojson_feature

class FloodAnalysisService:
    """
    SAR Inundation and Water Extent Analysis Pipeline.
    Evaluates evidence-based water anomalies vs baseline water masks without false emergency classifications.
    """

    def compute_flood_metrics(
        self,
        bbox: List[float],
        flooded_area_km2: float,
        water_polygons: List[Dict[str, Any]],
        confidence: float = 0.942,
        is_validated_disaster_zone: bool = False,
        baseline_water_km2: float = 0.0,
        is_demo: bool = False
    ) -> Dict[str, Any]:
        total_bbox_area_km2 = calculate_bbox_area_km2(bbox)
        effective_water_km2 = min(flooded_area_km2, total_bbox_area_km2)
        
        # Calculate anomalous water expansion relative to permanent water baseline
        anomalous_inundation_km2 = max(0.0, effective_water_km2 - baseline_water_km2)
        anomaly_ratio = anomalous_inundation_km2 / max(total_bbox_area_km2, 0.1)
        total_water_pct = round((effective_water_km2 / max(total_bbox_area_km2, 0.1)) * 100.0, 2)

        # Rigorous evidence-based risk & status classification
        if is_demo:
            status = "DEMO"
            severity = "NONE" if not is_validated_disaster_zone else "MODERATE"
            risk_protocol = "DEMO_SIMULATION"
        elif is_validated_disaster_zone:
            if anomaly_ratio >= 0.10:
                status = "CRITICAL"
                severity = "CRITICAL"
                risk_protocol = "EMERGENCY_EVACUATION"
            else:
                status = "HIGH_RISK"
                severity = "HIGH"
                risk_protocol = "DISASTER_ALERT"
        elif anomaly_ratio >= 0.15:
            status = "HIGH_RISK"
            severity = "HIGH"
            risk_protocol = "DISASTER_ALERT"
        elif anomaly_ratio >= 0.05:
            status = "WATCH"
            severity = "MODERATE"
            risk_protocol = "ELEVATED_WATCH"
        else:
            status = "NORMAL"
            severity = "NONE"
            risk_protocol = "ROUTINE_MONITORING"

        features: List[GeoJSONFeature] = []
        for idx, poly in enumerate(water_polygons):
            poly_severity = poly.get("severity") or severity
            poly_inundation_type = poly.get("inundation_type") or (
                "Permanent Water Extent / Water Body" if status == "NORMAL"
                else "Validated Flood Inundation Corridor" if status in ["HIGH_RISK", "CRITICAL"]
                else "Monitored Seasonal Water Zone"
            )

            feat = create_geojson_feature(
                feature_id=f"water-zone-{idx+1}",
                geometry_type="Polygon",
                coordinates=poly["coordinates"],
                properties={
                    "status": status,
                    "severity": poly_severity,
                    "depth_category": poly.get("depth_category", "Normal Depth Extent"),
                    "area_km2": poly.get("area_km2", round(effective_water_km2 / max(len(water_polygons), 1), 2)),
                    "risk_level": risk_protocol,
                    "inundation_type": poly_inundation_type,
                    "is_anomalous": anomalous_inundation_km2 > 0.5,
                    "confidence": confidence
                }
            )
            features.append(GeoJSONFeature(**feat))

        evidence = {
            "total_survey_area_km2": total_bbox_area_km2,
            "detected_water_area_km2": round(effective_water_km2, 2),
            "baseline_permanent_water_km2": round(baseline_water_km2, 2),
            "anomalous_expansion_km2": round(anomalous_inundation_km2, 2),
            "water_coverage_pct": total_water_pct,
            "anomaly_ratio_pct": round(anomaly_ratio * 100, 2),
            "is_validated_disaster_zone": is_validated_disaster_zone,
            "confidence_score": confidence,
            "sensor": "Sentinel-1 SAR C-Band / Dual-Pol VV+VH"
        }

        return {
            "status": status,
            "severity": severity,
            "risk_protocol": risk_protocol,
            "evidence": evidence,
            "total_area_km2": total_bbox_area_km2,
            "flooded_area_km2": round(effective_water_km2, 2),
            "anomalous_inundation_km2": round(anomalous_inundation_km2, 2),
            "flood_percentage": total_water_pct,
            "analysis_confidence": confidence,
            "feature_collection": GeoJSONFeatureCollection(features=features)
        }

flood_service = FloodAnalysisService()
FloodService = FloodAnalysisService
