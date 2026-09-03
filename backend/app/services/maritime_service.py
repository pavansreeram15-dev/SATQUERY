from typing import List, Optional
from datetime import datetime, timezone
from ..schemas.maritime_schemas import (
    MaritimePortSchema,
    MaritimeGeoJSONFeature,
    MaritimeGeoJSONGeometry,
    MaritimeFeatureCollectionSchema,
    MaritimeSearchResponse
)

MAJOR_GLOBAL_PORTS = [
    MaritimePortSchema(
        id="port-chennai",
        name="Chennai Port & Container Terminal",
        code="INMAA",
        category="Deepwater Port",
        country="India",
        latitude=13.105,
        longitude=80.305,
        berth_count=24,
        annual_traffic_teu="5.2M TEU",
        status="OPERATIONAL",
        ais_vessels_detected=48,
        description="Premier deepwater harbor on the Coromandel Coast with container terminals, oil docks, and cargo anchorages."
    ),
    MaritimePortSchema(
        id="port-mumbai-jnpt",
        name="Jawaharlal Nehru Port (JNPT Mumbai)",
        code="INBOM",
        category="Container Terminal",
        country="India",
        latitude=18.95,
        longitude=72.95,
        berth_count=32,
        annual_traffic_teu="6.1M TEU",
        status="OPERATIONAL",
        ais_vessels_detected=72,
        description="Largest container port in India, handling over 50% of the total containerized cargo across major Indian ports."
    ),
    MaritimePortSchema(
        id="port-kochi",
        name="Cochin Port & Vallarpadam ICTT",
        code="INKOC",
        category="Container Terminal",
        country="India",
        latitude=9.965,
        longitude=76.27,
        berth_count=18,
        annual_traffic_teu="1.2M TEU",
        status="OPERATIONAL",
        ais_vessels_detected=29,
        description="Strategic Arabian Sea international container transshipment terminal on primary global east-west shipping lanes."
    ),
    MaritimePortSchema(
        id="port-vizag",
        name="Visakhapatnam Deepwater Port",
        code="INVTZ",
        category="Deepwater Port",
        country="India",
        latitude=17.685,
        longitude=83.295,
        berth_count=28,
        annual_traffic_teu="3.8M TEU",
        status="OPERATIONAL",
        ais_vessels_detected=34,
        description="Natural deepwater harbor on the Bay of Bengal serving strategic naval, iron ore, petroleum, and cargo operations."
    ),
    MaritimePortSchema(
        id="port-singapore",
        name="Port of Singapore Megaport (Tuas/PSA)",
        code="SGSIN",
        category="Container Terminal",
        country="Singapore",
        latitude=1.283,
        longitude=103.85,
        berth_count=67,
        annual_traffic_teu="39.0M TEU",
        status="OPERATIONAL",
        ais_vessels_detected=215,
        description="World top transshipment hub connecting over 600 ports in 120 countries at the Malacca Strait."
    ),
    MaritimePortSchema(
        id="port-rotterdam",
        name="Port of Rotterdam Gateway",
        code="NLRTM",
        category="Deepwater Port",
        country="Netherlands",
        latitude=51.924,
        longitude=4.477,
        berth_count=90,
        annual_traffic_teu="14.5M TEU",
        status="OPERATIONAL",
        ais_vessels_detected=142,
        description="Largest seaport in Europe with automated container terminals, petrochemical refining, and deep sea access."
    ),
    MaritimePortSchema(
        id="port-shanghai",
        name="Shanghai International Port (Yangshan)",
        code="CNSHA",
        category="Container Terminal",
        country="China",
        latitude=31.23,
        longitude=121.47,
        berth_count=125,
        annual_traffic_teu="47.3M TEU",
        status="OPERATIONAL",
        ais_vessels_detected=310,
        description="Busiest container port globally with Yangshan deepwater automated mega-terminal connected by Donghai Bridge."
    ),
    MaritimePortSchema(
        id="port-suez",
        name="Suez Canal Maritime Gateway (Port Said)",
        code="EGPSD",
        category="Canal Transit Gateway",
        country="Egypt",
        latitude=31.265,
        longitude=32.302,
        berth_count=22,
        annual_traffic_teu="4.8M TEU",
        status="ACTIVE_SURVEILLANCE",
        ais_vessels_detected=86,
        description="Critical international waterway enabling shortest maritime trade link between Asia, Middle East, and Europe."
    ),
    MaritimePortSchema(
        id="port-panama",
        name="Panama Canal Pacific Terminal (Balboa)",
        code="PAPTY",
        category="Canal Transit Gateway",
        country="Panama",
        latitude=8.955,
        longitude=-79.565,
        berth_count=16,
        annual_traffic_teu="3.5M TEU",
        status="OPERATIONAL",
        ais_vessels_detected=64,
        description="Inter-oceanic canal lock system linking the Atlantic and Pacific Oceans with neo-panamax transit gates."
    ),
    MaritimePortSchema(
        id="port-jebel-ali",
        name="Port of Jebel Ali (DP World Dubai)",
        code="AEJEA",
        category="Deepwater Port",
        country="United Arab Emirates",
        latitude=25.01,
        longitude=55.06,
        berth_count=55,
        annual_traffic_teu="14.0M TEU",
        status="OPERATIONAL",
        ais_vessels_detected=98,
        description="Largest man-made harbor and principal maritime logistics hub across the Persian Gulf and Middle East."
    ),
    MaritimePortSchema(
        id="port-los-angeles",
        name="Port of Los Angeles & Long Beach",
        code="USLAX",
        category="Container Terminal",
        country="United States",
        latitude=33.74,
        longitude=-118.27,
        berth_count=43,
        annual_traffic_teu="10.6M TEU",
        status="OPERATIONAL",
        ais_vessels_detected=112,
        description="Leading seaport in North America by container volume and primary trans-Pacific maritime trade gateway."
    )
]

class MaritimeService:
    """
    Subsystem managing global maritime infrastructure, deepwater ports, and harbor terminals.
    """

    def get_ports(self, bbox: Optional[str] = None) -> MaritimeFeatureCollectionSchema:
        ports = MAJOR_GLOBAL_PORTS

        if bbox:
            try:
                parts = [float(p.strip()) for p in bbox.split(",")]
                if len(parts) == 4:
                    min_lon, min_lat, max_lon, max_lat = parts
                    filtered = [
                        p for p in ports
                        if (min_lon - 0.5 <= p.longitude <= max_lon + 0.5) and (min_lat - 0.5 <= p.latitude <= max_lat + 0.5)
                    ]
                    if filtered:
                        ports = filtered
            except Exception:
                pass

        features = [
            MaritimeGeoJSONFeature(
                id=p.id,
                geometry=MaritimeGeoJSONGeometry(coordinates=[p.longitude, p.latitude]),
                properties=p
            )
            for p in ports
        ]

        return MaritimeFeatureCollectionSchema(
            type="FeatureCollection",
            features=features,
            metadata={
                "total_ports": len(features),
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "source": "SATQUERY Maritime Infrastructure Subsystem"
            }
        )

    def search_ports(self, query: str) -> MaritimeSearchResponse:
        q = query.lower().strip()
        if not q:
            return MaritimeSearchResponse(total=len(MAJOR_GLOBAL_PORTS), ports=MAJOR_GLOBAL_PORTS)

        matched = [
            p for p in MAJOR_GLOBAL_PORTS
            if q in p.name.lower() or q in p.code.lower() or q in p.country.lower() or q in p.category.lower()
        ]
        return MaritimeSearchResponse(total=len(matched), ports=matched)

maritime_service = MaritimeService()
