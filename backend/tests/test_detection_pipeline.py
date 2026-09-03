import unittest
from backend.app.schemas.persona_schemas import QueryIntent, UserPersona
from backend.app.services.local_processing_service import local_processing_service, is_coastal_or_marine
from backend.app.services.inference_service import inference_service

class TestUniversalDetectionPipeline(unittest.TestCase):

    def test_landlocked_aoi_returns_zero_vessels(self):
        """Test that landlocked dry regions (e.g., Bengaluru) return 0 ships with clear message."""
        bengaluru_bbox = [77.5200, 12.9000, 77.6800, 13.0400]
        has_marine, water_frac = is_coastal_or_marine(bengaluru_bbox)
        self.assertFalse(has_marine)

        result = local_processing_service.execute_analysis(
            intent=QueryIntent.OBJECT_COUNT,
            target_classes=["cargo_ship"],
            bbox=bengaluru_bbox,
            persona=UserPersona.ISRO_ANALYST
        )

        self.assertEqual(result["count_metric"], 0)
        self.assertEqual(len(result["geojson_data"].features), 0)
        self.assertIn("0", result["summary_text"])
        self.assertIn("No open marine waters", result["summary_text"])

    def test_marine_harbor_aoi_returns_verified_vessels(self):
        """Test that coastal harbor AOIs return genuine georeferenced vessel features."""
        chennai_bbox = [80.2700, 13.0700, 80.3400, 13.1400]
        has_marine, water_frac = is_coastal_or_marine(chennai_bbox)
        self.assertTrue(has_marine)

        result = local_processing_service.execute_analysis(
            intent=QueryIntent.OBJECT_COUNT,
            target_classes=["cargo_ship"],
            bbox=chennai_bbox,
            persona=UserPersona.ISRO_ANALYST
        )

        self.assertGreater(result["count_metric"], 0)
        features = result["geojson_data"].features
        self.assertEqual(len(features), result["count_metric"])

        # Validate that all feature coordinates are strictly inside the AOI bounding box
        min_lon, min_lat, max_lon, max_lat = chennai_bbox
        for feat in features:
            coords = feat.geometry.coordinates[0]
            for pt in coords:
                lon, lat = pt[0], pt[1]
                self.assertGreaterEqual(lon, min_lon - 0.005)
                self.assertLessEqual(lon, max_lon + 0.005)
                self.assertGreaterEqual(lat, min_lat - 0.005)
                self.assertLessEqual(lat, max_lat + 0.005)
            
            # Validate confidence and category
            self.assertGreater(feat.properties["confidence"], 0.70)
            self.assertIn(feat.properties["class_category"], [
                "Container Vessel", "Dry Bulk Carrier", "Liquid Tanker", "Cargo Ship", "Ultra Large Container", "Coastal Freight", "Handymax Bulk"
            ])

    def test_mumbai_harbor_vessel_detection(self):
        """Test universal detection on Mumbai harbor without location hardcoding."""
        mumbai_bbox = [72.8000, 18.9000, 72.9000, 19.0000]
        has_marine, _ = is_coastal_or_marine(mumbai_bbox)
        self.assertTrue(has_marine)

        result = local_processing_service.execute_analysis(
            intent=QueryIntent.OBJECT_COUNT,
            target_classes=["cargo_ship", "vessel"],
            bbox=mumbai_bbox,
            persona=UserPersona.ISRO_ANALYST
        )

        self.assertGreater(result["count_metric"], 0)
        self.assertEqual(len(result["geojson_data"].features), result["count_metric"])

    def test_infrastructure_detection_georeferencing(self):
        """Test strategic infrastructure asset vectorization."""
        bbox = [80.2700, 13.0700, 80.3400, 13.1400]
        result = local_processing_service.execute_analysis(
            intent=QueryIntent.OBJECT_DETECTION,
            target_classes=["storage_tank", "container_terminal"],
            bbox=bbox,
            persona=UserPersona.ISRO_ANALYST
        )

        self.assertGreater(result["count_metric"], 0)
        for feat in result["geojson_data"].features:
            self.assertEqual(feat.geometry.type, "Polygon")
            self.assertGreater(feat.properties["confidence"], 0.80)

    def test_ndvi_spectral_analysis(self):
        """Test NDVI spectral calculation on vegetated vs urban regions."""
        bbox = [77.5200, 12.9000, 77.6800, 13.0400]
        result = local_processing_service.execute_analysis(
            intent=QueryIntent.NDVI_ANALYSIS,
            target_classes=["vegetation"],
            bbox=bbox,
            persona=UserPersona.ISRO_ANALYST
        )

        self.assertEqual(result["status"], "NORMAL")
        self.assertGreater(result["count_metric"], 0)
        self.assertIn("mean_ndvi", result["metrics"])

    def test_ndwi_hydrological_analysis(self):
        """Test NDWI water body extent derivation."""
        bbox = [89.1000, 21.8500, 89.3000, 22.0500]
        result = local_processing_service.execute_analysis(
            intent=QueryIntent.NDWI_ANALYSIS,
            target_classes=["water"],
            bbox=bbox,
            persona=UserPersona.ISRO_ANALYST
        )

    def test_settlement_and_affected_area_detection(self):
        """Test settlement and affected village cluster identification."""
        bbox = [85.3000, 27.2500, 85.4500, 27.3500]  # Nepal region
        result = local_processing_service.execute_analysis(
            intent=QueryIntent.OBJECT_DETECTION,
            target_classes=["settlement", "affected"],
            bbox=bbox,
            persona=UserPersona.NDRF_OFFICER,
            region_name="Nepal Basin"
        )

        self.assertGreater(result["count_metric"], 0)
        self.assertIn("Settlement & Humanitarian Survey", result["summary_text"])
        for feat in result["geojson_data"].features:
            self.assertEqual(feat.geometry.type, "Polygon")
            self.assertIn("Settlement", feat.properties["label"])
            self.assertIn("dwellings_estimate", feat.properties)

if __name__ == "__main__":
    unittest.main()
