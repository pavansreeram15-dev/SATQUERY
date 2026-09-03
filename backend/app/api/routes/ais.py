from typing import List, Optional
from fastapi import APIRouter, Query, Body
from ...schemas.ais_schemas import (
    AISVessel,
    AISVesselSearchResult,
    AISCorrelationMatch,
    AISStatusResponse
)
from ...services.ais_service import ais_service

router = APIRouter()

@router.get("/vessels", response_model=List[AISVessel])
async def get_ais_vessels(
    bbox: Optional[str] = Query(None, description="Bounding box 'min_lon,min_lat,max_lon,max_lat'"),
    ship_types: Optional[str] = Query(None, description="Comma-separated ship types e.g. Cargo,Tanker,Passenger"),
    min_speed: Optional[float] = Query(None, description="Minimum speed in knots"),
    max_speed: Optional[float] = Query(None, description="Maximum speed in knots"),
    nav_status: Optional[str] = Query(None, description="Navigation status filter"),
    q: Optional[str] = Query(None, description="Search query for MMSI, Name, or IMO")
):
    """
    Retrieve live AIS vessel positions for the requested viewport BBOX and filter criteria.
    """
    parsed_bbox = None
    if bbox:
        try:
            parts = [float(x.strip()) for x in bbox.split(",")]
            if len(parts) == 4:
                parsed_bbox = parts
                ais_service.update_active_viewport(parsed_bbox)
        except Exception:
            pass

    st_list = [x.strip() for x in ship_types.split(",")] if ship_types else None

    return ais_service.get_vessels(
        bbox=parsed_bbox,
        ship_types=st_list,
        min_speed=min_speed,
        max_speed=max_speed,
        nav_status=nav_status,
        search_query=q
    )

@router.get("/search", response_model=AISVesselSearchResult)
async def search_ais_vessels(
    q: str = Query(..., min_length=1, description="MMSI, Vessel Name, or IMO number")
):
    """
    Global search across cached live AIS vessels by MMSI, Name, or IMO.
    """
    return ais_service.search_vessels(query=q)

@router.get("/status", response_model=AISStatusResponse)
async def get_ais_status():
    """
    Return current AISStream WebSocket gateway telemetry and connection state.
    """
    return ais_service.get_status()

@router.post("/correlation", response_model=List[AISCorrelationMatch])
async def correlate_ais_satellite(
    request: dict = Body(...)
):
    """
    Perform spatial & temporal correlation between satellite ship detections and live AIS telemetry.
    """
    bbox = request.get("bbox")
    features = request.get("features", [])
    return ais_service.correlate_satellite_detections(sat_features=features, bbox=bbox)
