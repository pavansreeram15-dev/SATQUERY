import unittest
import time
from backend.app.services.ais_service import (
    ais_service,
    haversine_km,
    map_ship_type,
    map_nav_status
)
from backend.app.schemas.ais_schemas import AISVessel

class TestAISServiceUnit(unittest.TestCase):

    def setUp(self):
        ais_service._vessels_cache.clear()

    def test_haversine_distance(self):
        # Distance between Chennai Port (13.0827, 80.2707) and Singapore (1.3521, 103.8198)
        dist = haversine_km(13.0827, 80.2707, 1.3521, 103.8198)
        self.assertTrue(2800 < dist < 3000, f"Distance expected ~2900 km, got {dist}")

    def test_map_ship_type(self):
        self.assertEqual(map_ship_type(70), "Cargo")
        self.assertEqual(map_ship_type(80), "Tanker")
        self.assertEqual(map_ship_type(60), "Passenger")
        self.assertEqual(map_ship_type(30), "Fishing")
        self.assertEqual(map_ship_type(52), "Tug")

    def test_map_nav_status(self):
        self.assertEqual(map_nav_status(0), "Under Way Using Engine")
        self.assertEqual(map_nav_status(1), "At Anchor")
        self.assertEqual(map_nav_status(5), "Moored")

    def test_parse_position_report(self):
        raw_msg = {
            "MessageType": "PositionReport",
            "MetaData": {
                "MMSI": 413245678,
                "ShipName": "EVER GIVEN",
                "latitude": 29.95,
                "longitude": 32.55
            },
            "Message": {
                "PositionReport": {
                    "Sog": 14.5,
                    "Cog": 182.0,
                    "TrueHeading": 180.0,
                    "NavigationalStatus": 0
                }
            }
        }
        res = ais_service.parse_ais_message(raw_msg)
        self.assertIsNotNone(res)
        self.assertEqual(res["mmsi"], "413245678")
        self.assertEqual(res["name"], "EVER GIVEN")
        self.assertEqual(res["speed_knots"], 14.5)
        self.assertEqual(res["latitude"], 29.95)

    def test_get_vessels_filtering(self):
        raw_msg_1 = {
            "MessageType": "PositionReport",
            "MetaData": {"MMSI": 100000001, "ShipName": "CARGO VESSEL 1", "latitude": 13.08, "longitude": 80.30},
            "Message": {"PositionReport": {"Sog": 12.0, "Cog": 90.0, "NavigationalStatus": 0}}
        }
        raw_msg_2 = {
            "MessageType": "PositionReport",
            "MetaData": {"MMSI": 200000002, "ShipName": "TANKER ALPHA", "latitude": 1.35, "longitude": 103.81},
            "Message": {"PositionReport": {"Sog": 4.0, "Cog": 45.0, "NavigationalStatus": 1}}
        }
        ais_service.parse_ais_message(raw_msg_1)
        ais_service.parse_ais_message(raw_msg_2)

        # Filter by Chennai BBOX [80.0, 12.5, 81.0, 13.5]
        chennai_vessels = ais_service.get_vessels(bbox=[80.0, 12.5, 81.0, 13.5])
        self.assertEqual(len(chennai_vessels), 1)
        self.assertEqual(chennai_vessels[0].mmsi, "100000001")

        # Search by query
        search_res = ais_service.search_vessels("TANKER")
        self.assertEqual(len(search_res.vessels), 1)
        self.assertEqual(search_res.vessels[0].mmsi, "200000002")

    def test_satellite_ais_correlation(self):
        raw_msg = {
            "MessageType": "PositionReport",
            "MetaData": {"MMSI": 300000003, "ShipName": "CONTAINER SHIP BRAVO", "latitude": 13.082, "longitude": 80.270},
            "Message": {"PositionReport": {"Sog": 10.0, "Cog": 120.0, "NavigationalStatus": 0}}
        }
        ais_service.parse_ais_message(raw_msg)

        sat_features = [
            {
                "id": "sat-ship-01",
                "geometry": {"type": "Point", "coordinates": [80.271, 13.083]},
                "properties": {"target_class": "cargo_ship", "area_m2": 4500}
            }
        ]
        correlations = ais_service.correlate_satellite_detections(sat_features=sat_features, bbox=[80.0, 12.5, 81.0, 13.5])
        self.assertEqual(len(correlations), 1)
        self.assertTrue(correlations[0].matched)
        self.assertEqual(correlations[0].status_label, "Possible AIS-Satellite Match")
        self.assertLess(correlations[0].distance_km, 1.0)

if __name__ == "__main__":
    unittest.main()
