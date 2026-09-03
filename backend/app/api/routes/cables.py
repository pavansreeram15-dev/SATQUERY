from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from ...schemas.cable_schemas import (
    SubmarineCableCollection,
    LandingPointCollection,
    SubmarineCableDetail
)
from ...services.cable_service import cable_service

router = APIRouter()

@router.get("/cables", response_model=SubmarineCableCollection)
async def get_submarine_cables(
    bbox: Optional[str] = Query(None, description="Bounding box 'min_lon,min_lat,max_lon,max_lat'")
):
    """
    Retrieve global submarine cable routes (GeoJSON MultiLineStrings) proxying Gigawatt Map & TeleGeography data.
    """
    parsed_bbox = None
    if bbox:
        try:
            parts = [float(x.strip()) for x in bbox.split(",")]
            if len(parts) == 4:
                parsed_bbox = parts
        except Exception:
            pass

    return await cable_service.get_cables(bbox=parsed_bbox)

@router.get("/landing-points", response_model=LandingPointCollection)
async def get_landing_points(
    bbox: Optional[str] = Query(None, description="Bounding box 'min_lon,min_lat,max_lon,max_lat'")
):
    """
    Retrieve submarine cable landing point markers (GeoJSON Points).
    """
    parsed_bbox = None
    if bbox:
        try:
            parts = [float(x.strip()) for x in bbox.split(",")]
            if len(parts) == 4:
                parsed_bbox = parts
        except Exception:
            pass

    return await cable_service.get_landing_points(bbox=parsed_bbox)

@router.get("/cables/{cable_id}", response_model=SubmarineCableDetail)
async def get_cable_detail(cable_id: str):
    """
    Retrieve detailed metadata for a specific submarine cable by ID.
    """
    detail = await cable_service.get_cable_detail(cable_id=cable_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Submarine cable '{cable_id}' not found.")
    return detail

@router.get("/search")
async def search_cables_and_landing_points(
    q: str = Query(..., description="Search query string")
):
    """
    Search submarine cables and landing points by name, owner, or country.
    """
    return await cable_service.search_cables(query=q)
