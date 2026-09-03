from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from ...schemas.cable_schemas import (
    SubmarineCablesResponse,
    LandingPointsResponse,
    CableDetailResponse,
    SubmarineCableFeature
)
from ...services.cable_service import cable_service

router = APIRouter()

@router.get("/cables", response_model=SubmarineCablesResponse, summary="Get Submarine Fiber Cables (Gigawatt Map)")
async def get_cables(bbox: Optional[str] = Query(None, description="Bounding box 'min_lon,min_lat,max_lon,max_lat'")):
    """
    Returns global submarine fiber optic cable routes GeoJSON (Gigawatt Map & TeleGeography open dataset).
    """
    return cable_service.get_cables(bbox=bbox)

@router.get("/landing-points", response_model=LandingPointsResponse, summary="Get Coastal Landing Points")
async def get_landing_points(bbox: Optional[str] = Query(None, description="Bounding box 'min_lon,min_lat,max_lon,max_lat'")):
    """
    Returns global submarine cable landing point terminals GeoJSON.
    """
    return cable_service.get_landing_points(bbox=bbox)

@router.get("/cables/search", response_model=dict, summary="Search Submarine Cables")
async def search_cables(q: str = Query(..., min_length=1, description="Search keyword")):
    """
    Search submarine cables by name, consortium owner, or route.
    """
    results = cable_service.search_cables(query=q)
    return {"success": True, "total": len(results), "cables": results}

@router.get("/cables/{cable_id}", response_model=CableDetailResponse, summary="Get Specific Submarine Cable Telemetry")
async def get_cable_by_id(cable_id: str):
    """
    Returns detailed technical specifications and landing terminals for a specific cable.
    """
    detail = cable_service.get_cable_detail(cable_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Cable '{cable_id}' not found.")
    return detail
