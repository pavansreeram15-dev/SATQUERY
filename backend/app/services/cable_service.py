import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from ..schemas.cable_schemas import (
    SubmarineCableFeature,
    SubmarineCableGeometry,
    SubmarineCableProperties,
    SubmarineCablesResponse,
    LandingPointFeature,
    LandingPointGeometry,
    LandingPointProperties,
    LandingPointsResponse,
    CableDetailResponse,
)

logger = logging.getLogger("satquery.cables")

DEFAULT_CABLES = [
    SubmarineCableFeature(
        id="sea-me-we-5",
        geometry=SubmarineCableGeometry(
            type="LineString",
            coordinates=[
                [103.85, 1.28], [98.38, 7.88], [80.30, 13.10], [72.82, 18.92],
                [55.30, 25.26], [43.14, 11.58], [32.55, 29.96], [14.50, 35.89], [5.37, 43.29]
            ]
        ),
        properties=SubmarineCableProperties(
            id="sea-me-we-5",
            name="SEA-ME-WE 5 (South East Asia-Middle East-Western Europe 5)",
            color="#06B6D4",
            length_km=20000.0,
            rfs_year=2016,
            owners=["Tata Communications", "Singtel", "Orange", "Telecom Egypt", "Bharti Airtel"],
            capacity_tbps=24.0,
            landing_points_count=17
        )
    ),
    SubmarineCableFeature(
        id="aae-1",
        geometry=SubmarineCableGeometry(
            type="LineString",
            coordinates=[
                [114.16, 22.28], [106.66, 10.76], [103.85, 1.28], [80.30, 13.10],
                [72.82, 18.92], [58.40, 23.58], [32.55, 29.96], [5.37, 43.29]
            ]
        ),
        properties=SubmarineCableProperties(
            id="aae-1",
            name="AAE-1 (Asia-Africa-Europe 1)",
            color="#3B82F6",
            length_km=25000.0,
            rfs_year=2017,
            owners=["China Unicom", "Telecom Egypt", "Etisalat", "Reliance Jio", "Ooredoo"],
            capacity_tbps=40.0,
            landing_points_count=19
        )
    ),
    SubmarineCableFeature(
        id="chennai-andaman-cani",
        geometry=SubmarineCableGeometry(
            type="LineString",
            coordinates=[
                [80.30, 13.10], [92.74, 11.66], [92.90, 12.92], [93.00, 9.16]
            ]
        ),
        properties=SubmarineCableProperties(
            id="chennai-andaman-cani",
            name="CANI (Chennai-Andaman & Nicobar Islands Cable)",
            color="#10B981",
            length_km=2314.0,
            rfs_year=2020,
            owners=["BSNL / Government of India", "NEC Corporation"],
            capacity_tbps=10.0,
            landing_points_count=8
        )
    ),
    SubmarineCableFeature(
        id="2africa",
        geometry=SubmarineCableGeometry(
            type="LineString",
            coordinates=[
                [-0.12, 51.50], [-9.14, 38.72], [-17.44, 14.69], [3.37, 6.52],
                [18.42, -33.92], [39.20, -6.16], [43.14, 11.58], [32.55, 29.96], [5.37, 43.29]
            ]
        ),
        properties=SubmarineCableProperties(
            id="2africa",
            name="2Africa Global High-Capacity Cable",
            color="#F59E0B",
            length_km=45000.0,
            rfs_year=2024,
            owners=["Meta (Facebook)", "Vodafone", "Orange", "China Mobile", "Telecom Egypt", "MTN"],
            capacity_tbps=180.0,
            landing_points_count=46
        )
    ),
    SubmarineCableFeature(
        id="dunant",
        geometry=SubmarineCableGeometry(
            type="LineString",
            coordinates=[
                [-75.97, 36.85], [-1.17, 46.16]
            ]
        ),
        properties=SubmarineCableProperties(
            id="dunant",
            name="Dunant Transatlantic Fiber Highway",
            color="#EC4899",
            length_km=6400.0,
            rfs_year=2021,
            owners=["Google Cloud Infrastructure", "SubCom"],
            capacity_tbps=250.0,
            landing_points_count=2
        )
    ),
    SubmarineCableFeature(
        id="mist",
        geometry=SubmarineCableGeometry(
            type="LineString",
            coordinates=[
                [103.85, 1.28], [100.32, 5.41], [96.19, 16.86], [80.30, 13.10], [72.82, 18.92]
            ]
        ),
        properties=SubmarineCableProperties(
            id="mist",
            name="MIST (Malaysia-India-Singapore-Thailand Cable)",
            color="#8B5CF6",
            length_km=8100.0,
            rfs_year=2023,
            owners=["NTT Ltd", "Orient Link", "Wistron"],
            capacity_tbps=216.0,
            landing_points_count=5
        )
    ),
]

DEFAULT_LANDING_POINTS = [
    LandingPointFeature(
        id="lp-chennai",
        geometry=LandingPointGeometry(coordinates=[80.305, 13.105]),
        properties=LandingPointProperties(
            id="lp-chennai",
            name="Chennai Landing Station (San Thome / Ernavur)",
            country="India",
            latitude=13.105,
            longitude=80.305,
            cables_count=6,
            cable_names=["SEA-ME-WE 5", "AAE-1", "CANI", "MIST", "BBG", "i2i"]
        )
    ),
    LandingPointFeature(
        id="lp-mumbai",
        geometry=LandingPointGeometry(coordinates=[72.825, 18.925]),
        properties=LandingPointProperties(
            id="lp-mumbai",
            name="Mumbai Landing Station (Prabhadevi / Versova)",
            country="India",
            latitude=18.925,
            longitude=72.825,
            cables_count=9,
            cable_names=["SEA-ME-WE 5", "AAE-1", "MIST", "FLAG", "MENA", "Tata TGN"]
        )
    ),
    LandingPointFeature(
        id="lp-singapore",
        geometry=LandingPointGeometry(coordinates=[103.85, 1.28]),
        properties=LandingPointProperties(
            id="lp-singapore",
            name="Singapore Tuas & Changi Landing Gateway",
            country="Singapore",
            latitude=1.28,
            longitude=103.85,
            cables_count=24,
            cable_names=["SEA-ME-WE 5", "AAE-1", "MIST", "APCN-2", "SJC2", "Bifrost"]
        )
    ),
    LandingPointFeature(
        id="lp-marseille",
        geometry=LandingPointGeometry(coordinates=[5.37, 43.29]),
        properties=LandingPointProperties(
            id="lp-marseille",
            name="Marseille Mediterranean Gateway",
            country="France",
            latitude=43.29,
            longitude=5.37,
            cables_count=16,
            cable_names=["SEA-ME-WE 5", "AAE-1", "2Africa", "PEACE", "Medusa"]
        )
    ),
    LandingPointFeature(
        id="lp-virginia-beach",
        geometry=LandingPointGeometry(coordinates=[-75.97, 36.85]),
        properties=LandingPointProperties(
            id="lp-virginia-beach",
            name="Virginia Beach CLS",
            country="United States",
            latitude=36.85,
            longitude=-75.97,
            cables_count=5,
            cable_names=["Dunant", "MAREA", "BRUSA", "Grace Hopper", "Confluence-1"]
        )
    ),
]

class CableService:
    def get_cables(self, bbox: Optional[str] = None) -> SubmarineCablesResponse:
        cables = DEFAULT_CABLES
        return SubmarineCablesResponse(
            type="FeatureCollection",
            features=cables,
            metadata={
                "total_cables": len(cables),
                "source": "Gigawatt Map & TeleGeography Submarine Cable Dataset",
                "license": "CC BY-NC-SA 3.0",
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
        )

    def get_landing_points(self, bbox: Optional[str] = None) -> LandingPointsResponse:
        points = DEFAULT_LANDING_POINTS
        return LandingPointsResponse(
            type="FeatureCollection",
            features=points,
            metadata={
                "total_landing_points": len(points),
                "source": "Gigawatt Map & TeleGeography Open Dataset",
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
        )

    def get_cable_detail(self, cable_id: str) -> Optional[CableDetailResponse]:
        for c in DEFAULT_CABLES:
            if c.id == cable_id or c.properties.id == cable_id:
                return CableDetailResponse(
                    cable=c.properties,
                    landing_points=[lp.properties for lp in DEFAULT_LANDING_POINTS],
                    suppliers=["SubCom", "Alcatel Submarine Networks", "NEC"],
                    notes="High-reliability transoceanic fiber infrastructure."
                )
        return None

    def search_cables(self, query: str) -> List[SubmarineCableFeature]:
        q = query.lower().strip()
        if not q:
            return DEFAULT_CABLES
        return [
            c for c in DEFAULT_CABLES
            if q in c.properties.name.lower() or any(q in o.lower() for o in (c.properties.owners or []))
        ]

cable_service = CableService()
