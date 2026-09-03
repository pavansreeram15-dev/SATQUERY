import os
from typing import Dict, Any, List, Optional

BHUVAN_LAYERS = [
    {
        "id": "bhuvan_lulc_50k",
        "name": "ISRO Bhuvan LULC 50K (Land Use / Land Cover)",
        "serviceUrl": "https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms",
        "layerName": "lulc:LULC50K_1516",
        "format": "image/png",
        "transparent": True,
        "attribution": "ISRO / NRSC Bhuvan Geospatial Services",
        "category": "Thematic",
        "access_type": "PUBLIC_WMS",
        "enabled": True,
        "allowedPersonas": ["ISRO_ANALYST", "PUBLIC_RESEARCHER"]
    },
    {
        "id": "bhuvan_flood_hazard",
        "name": "ISRO Bhuvan Flood Inundation & Hazard Layer",
        "serviceUrl": "https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms",
        "layerName": "disaster:flood_hazard_india",
        "format": "image/png",
        "transparent": True,
        "attribution": "ISRO / NRSC Disaster Management Support Programme",
        "category": "Disaster",
        "access_type": "PUBLIC_WMS",
        "enabled": True,
        "allowedPersonas": ["ISRO_ANALYST", "NDRF_OFFICER"]
    },
    {
        "id": "bhuvan_wasteland",
        "name": "ISRO Bhuvan Wastelands Atlas of India",
        "serviceUrl": "https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms",
        "layerName": "wasteland:WL50K_1516",
        "format": "image/png",
        "transparent": True,
        "attribution": "ISRO / Department of Land Resources",
        "category": "Thematic",
        "access_type": "PUBLIC_WMS",
        "enabled": True,
        "allowedPersonas": ["ISRO_ANALYST", "PUBLIC_RESEARCHER"]
    },
    {
        "id": "bhuvan_geomorphology",
        "name": "ISRO Bhuvan Geomorphology & Lineaments",
        "serviceUrl": "https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms",
        "layerName": "geomorph:GM50K_1516",
        "format": "image/png",
        "transparent": True,
        "attribution": "ISRO / Geological Survey of India",
        "category": "Geology",
        "access_type": "PUBLIC_WMS",
        "enabled": True,
        "allowedPersonas": ["ISRO_ANALYST"]
    }
]

class BhuvanService:
    """
    ISRO Bhuvan Open Geospatial WMS & Thematic Layer Integration.
    Maintains strict truthfulness regarding public vs authenticated access.
    """
    @property
    def api_key(self) -> Optional[str]:
        val = os.getenv("BHUVAN_API_KEY", "").strip()
        return val if val else None

    def is_authenticated(self) -> bool:
        """Only returns True if a non-empty BHUVAN_API_KEY token is configured."""
        return self.api_key is not None

    def is_available(self) -> bool:
        """Public open WMS layers are accessible over HTTPS."""
        return True

    def get_layers(self, persona: Optional[str] = None) -> List[Dict[str, Any]]:
        """Return Bhuvan thematic layers filtered by persona authorization."""
        if not persona:
            return BHUVAN_LAYERS
        return [lyr for lyr in BHUVAN_LAYERS if persona in lyr.get("allowedPersonas", [])]

    def get_layer_by_id(self, layer_id: str) -> Optional[Dict[str, Any]]:
        for lyr in BHUVAN_LAYERS:
            if lyr["id"] == layer_id:
                return lyr
        return None

bhuvan_service = BhuvanService()

def get_bhuvan_layers() -> List[Dict[str, Any]]:
    """Return catalog of available ISRO Bhuvan WMS layers."""
    return bhuvan_service.get_layers()

