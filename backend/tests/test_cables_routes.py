import unittest
from backend.app.services.cable_service import cable_service

class TestCableServiceUnit(unittest.TestCase):
    def test_get_all_cables(self):
        result = cable_service.get_cables()
        self.assertEqual(result.type, "FeatureCollection")
        self.assertGreater(len(result.features), 0)
        self.assertIn("total_cables", result.metadata)

    def test_get_landing_points(self):
        result = cable_service.get_landing_points()
        self.assertEqual(result.type, "FeatureCollection")
        self.assertGreater(len(result.features), 0)
        self.assertIn("total_landing_points", result.metadata)

    def test_get_cable_detail(self):
        detail = cable_service.get_cable_detail("sea-me-we-5")
        self.assertIsNotNone(detail)
        self.assertEqual(detail.cable.id, "sea-me-we-5")
        self.assertEqual(detail.cable.name, "SEA-ME-WE 5 (South East Asia-Middle East-Western Europe 5)")

    def test_search_cables(self):
        results = cable_service.search_cables("chennai")
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0].id, "chennai-andaman-cani")

if __name__ == "__main__":
    unittest.main()
