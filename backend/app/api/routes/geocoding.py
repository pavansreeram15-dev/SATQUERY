from typing import List
from fastapi import APIRouter, Query
from ...schemas.response_schemas import LocationSearchResult
from ...services.geocoding_service import geocoding_service
from ...services.weather_service import weather_service

router = APIRouter()

@router.get("/location/search", response_model=List[LocationSearchResult])
async def search_location(
    q: str = Query(..., min_length=1, description="City, state, landmark, or coordinates e.g. '13.0827, 80.2707'"),
    limit: int = Query(5, ge=1, le=20)
):
    """
    Geocode user input query or parse GPS coordinates.
    """
    return await geocoding_service.search_location(query=q, limit=limit)

@router.get("/weather")
async def get_weather_context(
    lat: float = Query(..., description="Latitude in EPSG:4326"),
    lon: float = Query(..., description="Longitude in EPSG:4326")
):
    """
    Retrieve live and 7-day cumulative meteorological telemetry from Open-Meteo.
    """
    return await weather_service.get_environmental_context(lat=lat, lon=lon)
