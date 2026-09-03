import unittest
import asyncio
from backend.app.services.air_quality_service import air_quality_service

class TestAirQualityService(unittest.TestCase):
    def test_get_air_quality(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            res = loop.run_until_complete(air_quality_service.get_air_quality(13.0827, 80.2707))
            self.assertIsInstance(res, dict)
            self.assertIn("european_aqi", res)
            self.assertIn("category", res)
            self.assertIn("pollutants", res)
            self.assertIn("pm2_5_ug_m3", res["pollutants"])
            self.assertIn("source", res)
        finally:
            loop.close()

if __name__ == '__main__':
    unittest.main()
