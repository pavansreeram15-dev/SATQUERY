import unittest
import asyncio
from backend.app.services.geonames_service import geonames_service

class TestGeoNamesService(unittest.TestCase):
    def test_geonames_search(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            results = loop.run_until_complete(geonames_service.search("Chennai", max_rows=3))
            self.assertIsInstance(results, list)
            self.assertGreater(len(results), 0)
            self.assertTrue(any("Chennai" in item["name"] for item in results))
            self.assertIn("latitude", results[0])
            self.assertIn("longitude", results[0])
        finally:
            loop.close()

    def test_geonames_nearby(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            places = loop.run_until_complete(geonames_service.find_nearby(13.0827, 80.2707, radius_km=20))
            self.assertIsInstance(places, list)
            self.assertGreater(len(places), 0)
            self.assertIn("name", places[0])
        finally:
            loop.close()

    def test_geonames_elevation(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            elev = loop.run_until_complete(geonames_service.get_elevation(27.7172, 85.3240))
            self.assertIsInstance(elev, dict)
            self.assertIn("elevation_meters", elev)
            self.assertGreaterEqual(elev["elevation_meters"], 0)
        finally:
            loop.close()

if __name__ == '__main__':
    unittest.main()
