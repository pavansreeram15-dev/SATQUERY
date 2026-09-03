import unittest
from backend.app.services.maritime_service import maritime_service

class TestMaritimeInfrastructure(unittest.TestCase):
    def test_get_all_ports(self):
        result = maritime_service.get_ports()
        self.assertEqual(result.type, "FeatureCollection")
        self.assertGreater(len(result.features), 0)
        self.assertIn("total_ports", result.metadata)

    def test_get_ports_with_bbox(self):
        # Chennai harbor bbox
        bbox = "80.25,13.05,80.35,13.15"
        result = maritime_service.get_ports(bbox=bbox)
        self.assertEqual(result.type, "FeatureCollection")
        self.assertGreater(len(result.features), 0)
        # Check first port is Chennai
        self.assertEqual(result.features[0].properties.code, "INMAA")

    def test_search_ports(self):
        res = maritime_service.search_ports("chennai")
        self.assertTrue(res.success)
        self.assertGreater(res.total, 0)
        self.assertEqual(res.ports[0].code, "INMAA")

if __name__ == "__main__":
    unittest.main()
