import unittest
import asyncio
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta

from backend.app.schemas.disaster_schemas import (
    EarthEvent,
    DisasterType,
    DisasterSeverity,
    DisasterAlertLevel
)
from backend.app.services.disaster_providers.usgs_provider import USGSDisasterProvider
from backend.app.services.disaster_providers.eonet_provider import EONETDisasterProvider
from backend.app.services.disaster_providers.firms_provider import FIRMSDisasterProvider
from backend.app.services.disaster_providers.gdacs_provider import GDACSDisasterProvider
from backend.app.services.disaster_providers.imd_provider import IMDDisasterProvider
from backend.app.services.disaster_aggregator import DisasterAggregatorService, haversine_km

class TestDisasterProviders(unittest.IsolatedAsyncioTestCase):

    async def test_usgs_provider_parsing(self):
        """Test USGS GeoJSON feed parsing and normalization."""
        mock_payload = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "id": "us7000test",
                    "properties": {
                        "mag": 6.4,
                        "place": "42 km ENE of Sendai, Japan",
                        "time": 1725000000000,
                        "updated": 1725000500000,
                        "url": "https://earthquake.usgs.gov/earthquakes/eventpage/us7000test",
                        "title": "M 6.4 - 42 km ENE of Sendai, Japan",
                        "status": "reviewed",
                        "alert": "yellow"
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [141.2, 38.4, 42.5]
                    }
                }
            ]
        }

        provider = USGSDisasterProvider()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_payload

        with patch.object(provider, "_safe_http_get", return_value=mock_response):
            events = await provider.fetch_events(time_range="24h")
            self.assertEqual(len(events), 1)
            e = events[0]
            self.assertEqual(e.id, "dis-usgs-us7000test")
            self.assertEqual(e.type, DisasterType.EARTHQUAKE)
            self.assertEqual(e.magnitude, 6.4)
            self.assertEqual(e.depth_km, 42.5)
            self.assertEqual(e.latitude, 38.4)
            self.assertEqual(e.longitude, 141.2)
            self.assertEqual(e.country, "Japan")
            self.assertEqual(e.sources, ["USGS"])
            self.assertEqual(e.severity, DisasterSeverity.SEVERE)

    async def test_eonet_provider_parsing(self):
        """Test NASA EONET v3 multi-hazard parsing."""
        mock_payload = {
            "events": [
                {
                    "id": "EONET_6001",
                    "title": "Camp Fire Wildfire Complex",
                    "description": "Active forest fire ignition in Northern California",
                    "categories": [{"id": "wildfires", "title": "Wildfires"}],
                    "geometry": [
                        {
                            "magnitudeValue": 450.0,
                            "magnitudeUnit": "MW",
                            "date": "2026-08-30T12:00:00Z",
                            "type": "Point",
                            "coordinates": [-121.5, 39.8]
                        }
                    ],
                    "sources": [{"id": "InciWeb", "url": "https://inciweb.nwcg.gov"}]
                }
            ]
        }

        provider = EONETDisasterProvider()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_payload

        with patch.object(provider, "_safe_http_get", return_value=mock_response):
            events = await provider.fetch_events(time_range="24h")
            self.assertEqual(len(events), 1)
            e = events[0]
            self.assertEqual(e.id, "dis-eonet-EONET_6001")
            self.assertEqual(e.type, DisasterType.WILDFIRE)
            self.assertEqual(e.latitude, 39.8)
            self.assertEqual(e.longitude, -121.5)
            self.assertEqual(e.sources, ["EONET"])

    async def test_eonet_provider_drought_category(self):
        """Test NASA EONET v3 drought category normalization."""
        mock_payload = {
            "events": [
                {
                    "id": "EONET_7001",
                    "title": "Horn of Africa Drought",
                    "description": "Severe multi-season drought across East Africa",
                    "categories": [{"id": "drought", "title": "Drought"}],
                    "geometry": [
                        {
                            "date": "2026-08-30T12:00:00Z",
                            "type": "Point",
                            "coordinates": [45.0, 5.0]
                        }
                    ]
                }
            ]
        }

        provider = EONETDisasterProvider()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_payload

        with patch.object(provider, "_safe_http_get", return_value=mock_response):
            events = await provider.fetch_events(time_range="30d")
            self.assertEqual(len(events), 1)
            e = events[0]
            self.assertEqual(e.type, DisasterType.DROUGHT)

    async def test_gdacs_provider_drought_category(self):
        """Test GDACS drought alert category normalization."""
        mock_payload = {
            "features": [
                {
                    "type": "Feature",
                    "id": "1000999",
                    "properties": {
                        "eventtype": "DR",
                        "eventid": "1000999",
                        "eventname": "Drought Alert - Sahel",
                        "alertlevel": "Orange",
                        "country": "Mali"
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-2.0, 15.0]
                    }
                }
            ]
        }

        provider = GDACSDisasterProvider()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_payload

        with patch.object(provider, "_safe_http_get", return_value=mock_response):
            events = await provider.fetch_events(time_range="30d")
            self.assertEqual(len(events), 1)
            e = events[0]
            self.assertEqual(e.type, DisasterType.DROUGHT)
            self.assertEqual(e.alert_level, DisasterAlertLevel.ORANGE)

    async def test_firms_provider_unconfigured_fallback(self):
        """Test FIRMS returns gracefully when FIRMS_MAP_KEY is missing."""
        provider = FIRMSDisasterProvider()
        with patch.dict("os.environ", {"FIRMS_MAP_KEY": ""}):
            events = await provider.fetch_events()
            self.assertEqual(len(events), 0)
            self.assertEqual(provider.status, "UNCONFIGURED")

    async def test_gdacs_provider_parsing(self):
        """Test GDACS disaster alerts parsing."""
        mock_payload = {
            "features": [
                {
                    "type": "Feature",
                    "id": "1000543",
                    "properties": {
                        "eventtype": "TC",
                        "eventid": "1000543",
                        "eventname": "Cyclone Kenneth",
                        "alertlevel": "Red",
                        "country": "Mozambique",
                        "fromdate": "2026-08-29T06:00:00Z"
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [40.5, -12.1]
                    }
                }
            ]
        }

        provider = GDACSDisasterProvider()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_payload

        with patch.object(provider, "_safe_http_get", return_value=mock_response):
            events = await provider.fetch_events(time_range="24h")
            self.assertEqual(len(events), 1)
            e = events[0]
            self.assertEqual(e.type, DisasterType.CYCLONE)
            self.assertEqual(e.alert_level, DisasterAlertLevel.RED)
            self.assertEqual(e.country, "Mozambique")

    def test_deduplication_combines_sources(self):
        """Test spatio-temporal deduplication merges USGS and GDACS reports."""
        aggregator = DisasterAggregatorService()
        
        ev_usgs = EarthEvent(
            id="dis-usgs-1",
            source="USGS",
            sources=["USGS"],
            type=DisasterType.EARTHQUAKE,
            title="M 6.5 Earthquake - Japan",
            latitude=38.40,
            longitude=141.20,
            magnitude=6.5,
            depth_km=40.0,
            severity=DisasterSeverity.SEVERE,
            alert_level=DisasterAlertLevel.ORANGE,
            start_time="2026-08-30T10:00:00Z"
        )

        ev_gdacs = EarthEvent(
            id="dis-gdacs-99",
            source="GDACS",
            sources=["GDACS"],
            type=DisasterType.EARTHQUAKE,
            title="Red Alert: Earthquake in Japan",
            latitude=38.45,
            longitude=141.25,
            magnitude=6.6,
            severity=DisasterSeverity.CRITICAL,
            alert_level=DisasterAlertLevel.RED,
            start_time="2026-08-30T10:05:00Z"
        )

        merged = aggregator.deduplicate_events([ev_usgs, ev_gdacs])
        self.assertEqual(len(merged), 1)
        m = merged[0]
        self.assertEqual(m.type, DisasterType.EARTHQUAKE)
        self.assertIn("USGS", m.sources)
        self.assertIn("GDACS", m.sources)
        self.assertEqual(m.severity, DisasterSeverity.CRITICAL)
        self.assertEqual(m.alert_level, DisasterAlertLevel.RED)

    def test_time_range_filter_immediate_execution(self):
        """Test that time_range filtering accurately filters events by time window."""
        aggregator = DisasterAggregatorService()
        now = datetime.now(timezone.utc)
        
        event_15m_ago = EarthEvent(
            id="ev-15m",
            source="USGS",
            sources=["USGS"],
            type=DisasterType.EARTHQUAKE,
            title="15 min ago earthquake",
            latitude=10.0,
            longitude=20.0,
            severity=DisasterSeverity.SMALL,
            alert_level=DisasterAlertLevel.GREEN,
            start_time=(now - timedelta(minutes=15)).isoformat()
        )

        event_3h_ago = EarthEvent(
            id="ev-3h",
            source="USGS",
            sources=["USGS"],
            type=DisasterType.EARTHQUAKE,
            title="3 hours ago earthquake",
            latitude=12.0,
            longitude=22.0,
            severity=DisasterSeverity.SMALL,
            alert_level=DisasterAlertLevel.GREEN,
            start_time=(now - timedelta(hours=3)).isoformat()
        )

        event_3d_ago = EarthEvent(
            id="ev-3d",
            source="EONET",
            sources=["EONET"],
            type=DisasterType.WILDFIRE,
            title="3 days ago wildfire",
            latitude=15.0,
            longitude=25.0,
            severity=DisasterSeverity.MAJOR,
            alert_level=DisasterAlertLevel.ORANGE,
            start_time=(now - timedelta(days=3)).isoformat()
        )

        all_evs = [event_15m_ago, event_3h_ago, event_3d_ago]

        # 1 Hour filter -> only 15m event
        res_1h = aggregator._apply_filters(all_evs, time_range="1h")
        self.assertEqual(len(res_1h), 1)
        self.assertEqual(res_1h[0].id, "ev-15m")

        # 24 Hours filter -> 15m and 3h events
        res_24h = aggregator._apply_filters(all_evs, time_range="24h")
        self.assertEqual(len(res_24h), 2)
        self.assertIn("ev-15m", [e.id for e in res_24h])
        self.assertIn("ev-3h", [e.id for e in res_24h])

        # 7 Days filter -> all 3 events
        res_7d = aggregator._apply_filters(all_evs, time_range="7d")
        self.assertEqual(len(res_7d), 3)

    async def test_imd_provider_monsoon_parsing(self):
        """Test IMD Live Monsoon Heavy Rainfall and Cloudburst flood alerts."""
        provider = IMDDisasterProvider()
        events = await provider.fetch_events(time_range="24h")
        self.assertGreater(len(events), 0)
        
        # Verify Kerala Wayanad / Periyar flood warnings
        kerala_events = [e for e in events if "Kerala" in (e.region or "") or "Wayanad" in e.title]
        self.assertGreater(len(kerala_events), 0)
        ke = kerala_events[0]
        self.assertEqual(ke.source, "IMD")
        self.assertEqual(ke.type, DisasterType.FLOOD)
        self.assertIn("IMD", ke.sources)

if __name__ == "__main__":
    unittest.main()
