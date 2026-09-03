import unittest
import numpy as np

from backend.app.schemas.persona_schemas import UserPersona, QueryIntent
from backend.app.services.permission_service import check_permission
from backend.app.services.data_source_router import route_data_source, check_external_service_availability
from backend.app.utils.spectral_math import compute_ndvi, compute_ndwi
from backend.app.utils.geo_utils import calculate_bbox_area_km2
from backend.app.services.local_processing_service import local_processing_service, SAMPLE_REGIONS
from backend.app.services.flood_service import flood_service

class TestSATQUERYCore(unittest.TestCase):

    # =====================================================================
    # 1. PERMISSION SYSTEM & RBAC TESTS
    # =====================================================================

    def test_permission_system_public_researcher(self):
        """PUBLIC_RESEARCHER should have access to NDVI, NDWI, Change Detection, but BLOCKED from Object Detection & Flood SAR."""
        self.assertTrue(check_permission(UserPersona.PUBLIC_RESEARCHER, QueryIntent.NDVI_ANALYSIS)["allowed"])
        self.assertTrue(check_permission(UserPersona.PUBLIC_RESEARCHER, QueryIntent.NDWI_ANALYSIS)["allowed"])
        self.assertTrue(check_permission(UserPersona.PUBLIC_RESEARCHER, QueryIntent.CHANGE_DETECTION)["allowed"])
        
        # Denied
        obj_check = check_permission(UserPersona.PUBLIC_RESEARCHER, QueryIntent.OBJECT_DETECTION)
        self.assertFalse(obj_check["allowed"])
        self.assertEqual(obj_check["error"], "PERMISSION_DENIED")

        flood_check = check_permission(UserPersona.PUBLIC_RESEARCHER, QueryIntent.FLOOD_DETECTION)
        self.assertFalse(flood_check["allowed"])

    def test_permission_system_ndrf_officer(self):
        """NDRF_OFFICER has access to Disaster/Flood/NDWI, but BLOCKED from Strategic Infrastructure & Military Silos."""
        self.assertTrue(check_permission(UserPersona.NDRF_OFFICER, QueryIntent.FLOOD_DETECTION)["allowed"])
        self.assertTrue(check_permission(UserPersona.NDRF_OFFICER, QueryIntent.NDWI_ANALYSIS)["allowed"])
        
        tank_check = check_permission(UserPersona.NDRF_OFFICER, QueryIntent.OBJECT_DETECTION, ["storage_tank"])
        self.assertFalse(tank_check["allowed"])
        self.assertEqual(tank_check["error"], "PERMISSION_DENIED")

    def test_permission_system_isro_analyst(self):
        """ISRO_ANALYST possesses full operational clearance across all geospatial pipelines."""
        self.assertTrue(check_permission(UserPersona.ISRO_ANALYST, QueryIntent.OBJECT_DETECTION)["allowed"])
        self.assertTrue(check_permission(UserPersona.ISRO_ANALYST, QueryIntent.OBJECT_COUNT)["allowed"])
        self.assertTrue(check_permission(UserPersona.ISRO_ANALYST, QueryIntent.FLOOD_DETECTION)["allowed"])
        self.assertTrue(check_permission(UserPersona.ISRO_ANALYST, QueryIntent.CHANGE_DETECTION)["allowed"])
        self.assertTrue(check_permission(UserPersona.ISRO_ANALYST, QueryIntent.NDVI_ANALYSIS)["allowed"])

    # =====================================================================
    # 2. SPECTRAL MATH FORMULA TESTS
    # =====================================================================

    def test_ndvi_calculation(self):
        """Verify exact Normalized Difference Vegetation Index formula: (NIR - RED) / (NIR + RED)."""
        nir = np.array([0.8, 0.5, 0.1])
        red = np.array([0.1, 0.3, 0.2])
        res = compute_ndvi(nir, red)
        self.assertAlmostEqual(res[0], 0.7 / 0.9, places=3)
        self.assertAlmostEqual(res[1], 0.2 / 0.8, places=3)

    def test_ndwi_calculation(self):
        """Verify exact Normalized Difference Water Index formula: (GREEN - NIR) / (GREEN + NIR)."""
        green = np.array([0.6, 0.2, 0.1])
        nir = np.array([0.1, 0.5, 0.4])
        res = compute_ndwi(green, nir)
        self.assertAlmostEqual(res[0], 0.5 / 0.7, places=3)

    # =====================================================================
    # 3. EVIDENCE-BASED DISASTER & SEVERITY CLASSIFICATION TESTS
    # =====================================================================

    def test_case_1_normal_city_classified_normal(self):
        """Case 1: Normal city (Chennai Port, Bengaluru) must return NORMAL with severity NONE."""
        res = local_processing_service.execute_analysis(
            intent=QueryIntent.OBJECT_COUNT,
            target_classes=["cargo_ship"],
            bbox=SAMPLE_REGIONS["Chennai Port"]["bbox"],
            persona=UserPersona.ISRO_ANALYST,
            region_name="Chennai Port"
        )
        self.assertEqual(res["status"], "NORMAL")
        self.assertEqual(res["severity"], "NONE")
        self.assertNotIn("EMERGENCY", res["summary_text"].upper())
        self.assertNotIn("CRITICAL", res["summary_text"].upper())

    def test_case_2_normal_river_lake_classified_normal(self):
        """Case 2: Normal river/lake water body must be classified as NORMAL, not flood disaster."""
        res = local_processing_service.execute_analysis(
            intent=QueryIntent.FLOOD_DETECTION,
            target_classes=["water_body"],
            bbox=SAMPLE_REGIONS["Chennai Port"]["bbox"],
            persona=UserPersona.NDRF_OFFICER,
            region_name="Chennai Port"
        )
        self.assertEqual(res["status"], "NORMAL")
        self.assertEqual(res["severity"], "NONE")
        self.assertNotIn("EMERGENCY", res["summary_text"].upper())
        self.assertNotIn("CRITICAL", res["summary_text"].upper())
        for feat in res["geojson_data"].features:
            self.assertEqual(feat.properties.get("status"), "NORMAL")
            self.assertNotEqual(feat.properties.get("risk_level"), "EMERGENCY_EVACUATION")

    def test_case_3_no_disaster_evidence_returns_normal(self):
        """Case 3: Vegetation or urban area with no disaster evidence returns NORMAL."""
        res = local_processing_service.execute_analysis(
            intent=QueryIntent.NDVI_ANALYSIS,
            target_classes=["vegetation"],
            bbox=SAMPLE_REGIONS["Sundarbans"]["bbox"],
            persona=UserPersona.PUBLIC_RESEARCHER,
            region_name="Sundarbans"
        )
        self.assertEqual(res["status"], "NORMAL")
        self.assertEqual(res["severity"], "NONE")

    def test_case_4_potential_anomaly_classified_watch(self):
        """Case 4: Potential anomaly with 5-15% water change is classified as WATCH with severity MODERATE."""
        res = flood_service.compute_flood_metrics(
            bbox=[91.70, 26.15, 91.88, 26.28],
            flooded_area_km2=35.0, # 25 km² anomalous expansion (~7.9% ratio)
            water_polygons=[{"coordinates": [[[91.7, 26.1], [91.8, 26.1], [91.8, 26.2], [91.7, 26.2], [91.7, 26.1]]]}],
            baseline_water_km2=10.0,
            is_validated_disaster_zone=False
        )
        self.assertEqual(res["status"], "WATCH")
        self.assertEqual(res["severity"], "MODERATE")
        self.assertNotEqual(res["risk_protocol"], "EMERGENCY_EVACUATION")

    def test_case_5_validated_significant_flood_classified_high_risk(self):
        """Case 5: Validated significant flood (15-30% expansion) classified as HIGH_RISK."""
        res = flood_service.compute_flood_metrics(
            bbox=[91.70, 26.15, 91.88, 26.28], # Total bbox area ~317 km²
            flooded_area_km2=75.0, # 65 km² anomalous expansion (~20.5% ratio)
            water_polygons=[{"coordinates": [[[91.7, 26.1], [91.8, 26.1], [91.8, 26.2], [91.7, 26.2], [91.7, 26.1]]]}],
            baseline_water_km2=10.0,
            is_validated_disaster_zone=False
        )
        self.assertEqual(res["status"], "HIGH_RISK")
        self.assertEqual(res["severity"], "HIGH")

    def test_case_6_strong_validated_flood_classified_critical(self):
        """Case 6: Strong validated flood (> 30% expansion in validated disaster zone) classified as CRITICAL."""
        res = flood_service.compute_flood_metrics(
            bbox=[91.70, 26.15, 91.88, 26.28], # Total bbox area ~317 km²
            flooded_area_km2=120.0, # > 30% anomalous expansion
            water_polygons=[{"coordinates": [[[91.7, 26.1], [91.8, 26.1], [91.8, 26.2], [91.7, 26.2], [91.7, 26.1]]]}],
            baseline_water_km2=10.0,
            is_validated_disaster_zone=True
        )
        self.assertEqual(res["status"], "CRITICAL")
        self.assertEqual(res["severity"], "CRITICAL")
        self.assertEqual(res["risk_protocol"], "EMERGENCY_EVACUATION")

    def test_case_7_demo_simulation_mode_never_presents_false_emergency(self):
        """Case 8: Demo/simulation data is marked DEMO and never presents false emergency evacuation intelligence."""
        res = flood_service.compute_flood_metrics(
            bbox=[91.70, 26.15, 91.88, 26.28],
            flooded_area_km2=48.6,
            water_polygons=[{"coordinates": [[[91.7, 26.1], [91.8, 26.1], [91.8, 26.2], [91.7, 26.2], [91.7, 26.1]]]}],
            is_demo=True
        )
        self.assertEqual(res["status"], "DEMO")
        self.assertEqual(res["risk_protocol"], "DEMO_SIMULATION")

if __name__ == "__main__":
    unittest.main()
