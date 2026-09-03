import unittest
import asyncio
from backend.app.services.cable_service import (
    cable_service,
    is_point_in_bbox,
    is_geometry_in_bbox,
    ATTRIBUTION_TEXT
)

class TestCableServiceUnit(unittest.TestCase):

    def test_point_in_bbox(self):
        bbox = [80.0, 12.0, 81.0, 14.0]
        self.assertTrue(is_point_in_bbox(80.27, 13.08, bbox))
        self.assertFalse(is_point_in_bbox(103.81, 1.35, bbox))

    def test_geometry_in_bbox(self):
        bbox = [80.0, 12.0, 81.0, 14.0]
        linestring = {"type": "LineString", "coordinates": [[79.5, 11.5], [80.25, 13.05]]}
        self.assertTrue(is_geometry_in_bbox(linestring, bbox))

        out_line = {"type": "LineString", "coordinates": [[10.0, 10.0], [11.0, 11.0]]}
        self.assertFalse(is_geometry_in_bbox(out_line, bbox))

    def test_cable_attribution(self):
        self.assertIn("Gigawatt Map / TeleGeography", ATTRIBUTION_TEXT)
        self.assertIn("CC BY-NC-SA 3.0", ATTRIBUTION_TEXT)

    def test_get_cables_mock_fetch(self):
        async def run_test():
            collection = await cable_service.get_cables(bbox=[80.0, 12.0, 81.0, 14.0])
            self.assertIsNotNone(collection)
            self.assertIn("CC BY-NC-SA 3.0", collection.attribution)

        asyncio.run(run_test())

if __name__ == "__main__":
    unittest.main()
