from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Query, HTTPException
from ...services.geonames_service import geonames_service

router = APIRouter()

@router.get("/search", summary="Search GeoNames Gazetteer")
async def search_geonames(
    q: str = Query(..., min_length=1, description="Place name, landmark, basin, or administrative division"),
    max_rows: int = Query(10, ge=1, le=50, description="Maximum number of results to return"),
    country_code: Optional[str] = Query(None, description="ISO-3166 2-letter country code filter (e.g. IN, NP, US)"),
    feature_class: Optional[str] = Query(None, description="Feature Class (e.g., P for populated place, H for stream/water, T for mountain)")
):
    """
    Query the official GeoNames global gazetteer database (25+ million geographical entries).
    """
    results = await geonames_service.search(
        query=q,
        max_rows=max_rows,
        country_code=country_code,
        feature_class=feature_class
    )
    return {
        "query": q,
        "count": len(results),
        "results": results
    }

@router.get("/nearby", summary="Find Populated Places Nearby Coordinates")
async def find_nearby_places(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude coordinate in WGS84 decimal degrees"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude coordinate in WGS84 decimal degrees"),
    radius_km: float = Query(30.0, ge=1.0, le=300.0, description="Search radius in kilometers"),
    max_rows: int = Query(5, ge=1, le=20, description="Maximum number of nearby places to return")
):
    """
    Reverse geocode coordinates to the nearest populated settlements, ports, and topographical features using GeoNames.
    """
    results = await geonames_service.find_nearby(
        lat=lat,
        lon=lon,
        radius_km=radius_km,
        max_rows=max_rows
    )
    return {
        "latitude": lat,
        "longitude": lon,
        "radius_km": radius_km,
        "count": len(results),
        "places": results
    }

@router.get("/elevation", summary="Get ASTER GDEM Terrain Elevation")
async def get_terrain_elevation(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude coordinate in WGS84 decimal degrees"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude coordinate in WGS84 decimal degrees")
):
    """
    Fetch exact terrain elevation in meters above sea level via GeoNames ASTER Global Digital Elevation Model (GDEM).
    """
    elev = await geonames_service.get_elevation(lat=lat, lon=lon)
    return elev
