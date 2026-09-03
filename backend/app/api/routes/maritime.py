from fastapi import APIRouter, Query
from typing import Optional
from ...schemas.maritime_schemas import MaritimeFeatureCollectionSchema, MaritimeSearchResponse
from ...services.maritime_service import maritime_service

router = APIRouter()

@router.get("/ports", response_model=MaritimeFeatureCollectionSchema, summary="Get Global Maritime Ports & Terminals")
async def get_maritime_ports(bbox: Optional[str] = Query(None, description="Bounding box 'min_lon,min_lat,max_lon,max_lat'")):
    """
    Returns global major seaports, container terminals, and maritime infrastructure GeoJSON.
    """
    return maritime_service.get_ports(bbox=bbox)

@router.get("/search", response_model=MaritimeSearchResponse, summary="Search Maritime Ports & Facilities")
async def search_maritime_ports(q: str = Query(..., min_length=1, description="Search query")):
    """
    Fast query search across ports, terminals, UN/LOCODE, and maritime infrastructure.
    """
    return maritime_service.search_ports(query=q)

@router.get("/summary", summary="Get Maritime Infrastructure Summary")
async def get_maritime_summary():
    """
    Returns global operational counts for ports, terminals, and submarine landing points.
    """
    ports = maritime_service.get_ports()
    return {
        "status": "OPERATIONAL",
        "total_ports": len(ports.features),
        "total_berths_monitored": sum(f.properties.berth_count or 0 for f in ports.features),
        "active_telemetry": True
    }
