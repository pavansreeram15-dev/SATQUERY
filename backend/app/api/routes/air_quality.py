from typing import Dict, Any
from fastapi import APIRouter, Query
from ...services.air_quality_service import air_quality_service

router = APIRouter()

@router.get("/air-quality", summary="Get Live European CAMS Air Quality & Atmospheric Index")
async def get_air_quality(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude coordinate in WGS84 decimal degrees"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude coordinate in WGS84 decimal degrees")
):
    """
    Retrieve real-time Air Quality Index (AQI), PM2.5, PM10, NO2, O3, CO, and Dust telemetry via Open-Meteo European Copernicus Atmosphere Monitoring Service (CAMS).
    """
    return await air_quality_service.get_air_quality(lat=lat, lon=lon)
