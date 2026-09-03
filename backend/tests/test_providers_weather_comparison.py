import unittest
from unittest.mock import patch, MagicMock
from backend.app.services.satellite_providers.planetary_computer_provider import PlanetaryComputerProvider
from backend.app.services.satellite_providers.copernicus_provider import CopernicusProvider
from backend.app.services.satellite_providers.provider_registry import SatelliteProviderRegistry
from backend.app.services.weather_service import WeatherService
from backend.app.services.geocoding_service import GeocodingService
from backend.app.services.temporal_comparison_service import TemporalComparisonService
from backend.app.schemas.persona_schemas import UserPersona, QueryIntent
from backend.app.services.local_processing_service import local_processing_service

class TestProvidersWeatherComparison(unittest.IsolatedAsyncioTestCase):

    async def test_planetary_computer_provider_parsing(self):
        """Test Microsoft Planetary Computer STAC parsing and normalization."""
        mock_stac_payload = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "id": "S2A_MSIL2A_20250615T050651_R019_T44VLR",
                    "bbox": [80.20, 13.00, 80.35, 13.15],
                    "properties": {
                        "datetime": "2025-06-15T05:06:51Z",
                        "eo:cloud_cover": 4.2,
                        "platform": "Sentinel-2A",
                        "instruments": ["msi"]
                    },
                    "assets": {
                        "rendered_preview": {"href": "https://planetarycomputer.microsoft.com/preview.png"}
                    }
                }
            ]
        }

        provider = PlanetaryComputerProvider()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_stac_payload

        with patch("httpx.AsyncClient.post", return_value=mock_resp):
            res = await provider.search_catalog(
                bbox=[80.20, 13.00, 80.35, 13.15],
                from_date="2025-01-01",
                to_date="2025-12-31"
            )
            self.assertTrue(res["success"])
            self.assertEqual(res["count"], 1)
            f = res["features"][0]
            self.assertEqual(f["provider"], "Planetary Computer")
            self.assertEqual(f["cloud_cover"], 4.2)
            self.assertEqual(f["resolution_meters"], 10.0)

    async def test_weather_service_open_meteo_parsing(self):
        """Test Open-Meteo environmental context fetch and precipitation summation."""
        mock_weather_payload = {
            "current": {
                "temperature_2m": 29.4,
                "relative_humidity_2m": 72,
                "precipitation": 0.0,
                "weather_code": 2,
                "wind_speed_10m": 14.5
            },
            "daily": {
                "precipitation_sum": [12.0, 24.5, 8.0, 0.0, 0.0, 5.5, 18.0]
            }
        }

        weather = WeatherService()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_weather_payload

        with patch("httpx.AsyncClient.get", return_value=mock_resp):
            res = await weather.get_environmental_context(lat=13.0827, lon=80.2707)
            self.assertTrue(res["success"])
            self.assertEqual(res["rainfall_7d_total_mm"], 68.0)
            self.assertEqual(res["weather_condition"], "Partly Cloudy")
            self.assertEqual(res["temperature_celsius"], 29.4)
            self.assertTrue(res["is_heavy_rain"])
            self.assertIn("68.0 mm", res["summary"])

    def test_geocoding_service_direct_coordinate_parsing(self):
        """Test direct coordinate resolution (e.g. '13.0827, 80.2707')."""
        geo = GeocodingService()
        res = geo.parse_direct_coordinates("13.0827, 80.2707")
        self.assertIsNotNone(res)
        self.assertAlmostEqual(res["lat"], 13.0827)
        self.assertAlmostEqual(res["lon"], 80.2707)
        self.assertEqual(len(res["bbox"]), 4)

    async def test_temporal_comparison_service_metrics(self):
        """Test multi-temporal comparison change delta calculation."""
        comp = TemporalComparisonService()
        chennai_bbox = [80.2700, 13.0700, 80.3400, 13.1400]
        res = await comp.execute_comparison(
            bbox=chennai_bbox,
            before_date_or_year=2023,
            after_date_or_year=2026,
            sensor_type="optical"
        )
        self.assertTrue(res["success"])
        self.assertIn("change_metrics", res)
        metrics = res["change_metrics"]
        self.assertGreater(metrics["total_changed_km2"], 0.0)
        self.assertGreater(metrics["built_up_expansion_km2"], 0.0)
        self.assertIn("feature_collection", res)
        self.assertGreater(len(res["feature_collection"].features), 0)

    def test_evidence_first_breakdown_in_local_processing(self):
        """Test that local_processing_service always generates structured evidence breakdown."""
        res = local_processing_service.execute_analysis(
            intent=QueryIntent.FLOOD_DETECTION,
            target_classes=["water"],
            bbox=[91.70, 26.15, 91.88, 26.28],
            persona=UserPersona.NDRF_OFFICER,
            region_name="Assam Flood Region"
        )
        self.assertIn("evidence_breakdown", res)
        eb = res["evidence_breakdown"]
        self.assertIn("satellite_evidence", eb)
        self.assertIn("weather_evidence", eb)
        self.assertIn("temporal_evidence", eb)
        self.assertIn("why_this_result", res)
        self.assertIn("limitations", res)

if __name__ == "__main__":
    unittest.main()
