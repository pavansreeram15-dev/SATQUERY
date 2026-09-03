import os
from typing import Dict, Any, List, Optional
from ..schemas.persona_schemas import QueryIntent, UserPersona, DataSourceType
from .sentinel_service import sentinel_service
from .gee_service import gee_service
from .bhuvan_service import bhuvan_service
from .satellite_providers.planetary_computer_provider import planetary_computer_provider
from .satellite_providers.copernicus_provider import copernicus_provider
from .weather_service import weather_service

def check_external_service_availability() -> Dict[str, bool]:
    """Check whether real API credentials and open discovery providers are genuinely available."""
    sentinel_configured = sentinel_service.is_configured()
    gee_configured = gee_service.is_configured()
    bhuvan_key_configured = bhuvan_service.is_authenticated()
    local_only = os.getenv("LOCAL_PROCESSING", "false").lower() in ("true", "1", "yes")
    
    return {
        "sentinel": sentinel_configured and not local_only,
        "planetary_computer": not local_only,
        "copernicus_cdse": not local_only,
        "open_meteo": not local_only,
        "gee": gee_configured and not local_only,
        "bhuvan_authenticated": bhuvan_key_configured,
        "bhuvan_public_wms": True,
        "local_only": local_only
    }

def route_data_source(
    intent: QueryIntent,
    target_classes: List[str],
    bbox: Optional[List[float]],
    persona: UserPersona,
    before_year: Optional[int] = None,
    after_year: Optional[int] = None,
    region_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Intelligently routes query to optimal satellite provider, GIS catalog, or verified local processing engine.
    Always maintains strict data honesty.
    """
    avail = check_external_service_availability()
    
    # 1. Historical Change Detection & Multi-year comparison
    if intent == QueryIntent.CHANGE_DETECTION or (before_year and after_year and (after_year - before_year) >= 2):
        if avail["gee"]:
            return {
                "selected_data_source": "Google Earth Engine",
                "execution_mode": "LIVE",
                "fallback_reason": None,
                "selected_dataset": "COPERNICUS/S2_SR + LANDSAT/LC09/C02/T1_L2",
                "analysis_pipeline": "GEE Multi-Temporal Composite Difference Engine",
                "is_real_service": True,
                "reason": "Google Earth Engine routed for planetary-scale multi-year optical & SAR time-series diff."
            }
        elif avail["planetary_computer"]:
            return {
                "selected_data_source": "Microsoft Planetary Computer",
                "execution_mode": "LIVE",
                "fallback_reason": None,
                "selected_dataset": "Planetary Computer (landsat-c2-l2 + sentinel-2-l2a)",
                "analysis_pipeline": "Multi-Temporal STAC Difference Pipeline",
                "is_real_service": True,
                "reason": "Planetary Computer routed for multi-decadal Landsat/Sentinel STAC time-series comparison."
            }
        else:
            return {
                "selected_data_source": "Local Processing Engine",
                "execution_mode": "FALLBACK",
                "fallback_reason": "Google Earth Engine credentials (GEE_SERVICE_ACCOUNT / GEE_PROJECT_ID) unconfigured in environment.",
                "selected_dataset": "Pre-calibrated Multi-Temporal Regional Matrix",
                "analysis_pipeline": "Local Normalized Difference & SSIM Change Pipeline",
                "is_real_service": False,
                "reason": "Routed to Local Processing: GEE credentials unconfigured in current environment. Using transparent local temporal difference algorithm."
            }

    # 2. Flood Inundation & SAR Analysis
    if intent == QueryIntent.FLOOD_DETECTION or (intent == QueryIntent.SPECTRAL_ANALYSIS and "sar" in target_classes):
        if avail["sentinel"]:
            return {
                "selected_data_source": "Sentinel Hub (Copernicus)",
                "execution_mode": "LIVE",
                "fallback_reason": None,
                "selected_dataset": "Sentinel-1 GRD (C-SAR Level-1 Interferometric Wide Swath)",
                "analysis_pipeline": "Dual-Polarization (VV/VH) Water Backscatter Thresholding + Open-Meteo Rainfall Context",
                "is_real_service": True,
                "reason": "Sentinel-1 SAR routed for cloud-penetrating synthetic aperture radar flood mapping with Open-Meteo meteorological fusion."
            }
        elif avail["planetary_computer"]:
            return {
                "selected_data_source": "Microsoft Planetary Computer",
                "execution_mode": "LIVE",
                "fallback_reason": None,
                "selected_dataset": "Sentinel-1 RTC / GRD (C-Band Radar)",
                "analysis_pipeline": "Planetary Computer SAR Water Inundation Pipeline + Open-Meteo",
                "is_real_service": True,
                "reason": "Planetary Computer open STAC routed for Sentinel-1 SAR observations with Open-Meteo weather context."
            }
        else:
            return {
                "selected_data_source": "Local Processing Engine",
                "execution_mode": "FALLBACK",
                "fallback_reason": "Sentinel Hub API credentials (SENTINELHUB_CLIENT_ID / SENTINELHUB_CLIENT_SECRET) unconfigured in environment.",
                "selected_dataset": "Brahmaputra Flood Basin SAR Simulation Matrix",
                "analysis_pipeline": "Local Otsu Water Inundation Thresholding + Open-Meteo Rainfall Context",
                "is_real_service": False,
                "reason": "Routed to Local Processing: Sentinel Hub API unconfigured. Executing local SAR water thresholding pipeline with live Open-Meteo weather context."
            }

    # 3. Spectral Indices (NDVI & NDWI)
    if intent in (QueryIntent.NDVI_ANALYSIS, QueryIntent.NDWI_ANALYSIS, QueryIntent.SPECTRAL_ANALYSIS):
        if avail["sentinel"]:
            return {
                "selected_data_source": "Sentinel Hub (Copernicus)",
                "execution_mode": "LIVE",
                "fallback_reason": None,
                "selected_dataset": "Sentinel-2 L2A (B04-Red, B08-NIR, B03-Green, B11-SWIR)",
                "analysis_pipeline": "Sentinel-2 Multi-Spectral Reflectance Formula Pipeline",
                "is_real_service": True,
                "reason": "Sentinel Hub routed for 10m bottom-of-atmosphere surface reflectance."
            }
        elif avail["planetary_computer"]:
            return {
                "selected_data_source": "Microsoft Planetary Computer",
                "execution_mode": "LIVE",
                "fallback_reason": None,
                "selected_dataset": "Planetary Computer Sentinel-2 L2A (10m Surface Reflectance)",
                "analysis_pipeline": "Planetary Computer STAC Spectral Reflectance Engine",
                "is_real_service": True,
                "reason": "Planetary Computer routed for 10m Sentinel-2 multi-spectral surface reflectance."
            }
        else:
            return {
                "selected_data_source": "Local Processing Engine",
                "execution_mode": "FALLBACK",
                "fallback_reason": "Sentinel Hub API credentials unconfigured in environment.",
                "selected_dataset": "Sentinel-2 Calibrated Spectral Reflectance Matrix",
                "analysis_pipeline": "Local Band Math Vector Engine ((NIR-RED)/(NIR+RED))",
                "is_real_service": False,
                "reason": "Routed to Local Processing: Sentinel-2 spectral math computed via high-precision local matrix engine."
            }

    # 4. Object Detection & Counting
    if intent in (QueryIntent.OBJECT_COUNT, QueryIntent.OBJECT_DETECTION, QueryIntent.SEGMENT_TERRAIN):
        if avail["sentinel"]:
            return {
                "selected_data_source": "Sentinel Hub (Copernicus)",
                "execution_mode": "LIVE",
                "fallback_reason": None,
                "selected_dataset": "Sentinel-2 High-Resolution Visual / Harmonized RGB",
                "analysis_pipeline": "YOLOv8-OBB / FastSAM Inference Pipeline",
                "is_real_service": True,
                "reason": "Sentinel Hub optical imagery routed for computer-vision feature detection."
            }
        else:
            return {
                "selected_data_source": "Local Processing Engine",
                "execution_mode": "FALLBACK",
                "fallback_reason": "Sentinel Hub optical catalog unconfigured in current environment.",
                "selected_dataset": "Geo-Calibrated Maritime & Infrastructure Vector Dataset",
                "analysis_pipeline": "Local Spatial Bounding Geometry & Confidence Filter",
                "is_real_service": False,
                "reason": "Routed to Local Processing: Computer vision inference executed on verified regional spatial footprints."
            }

    # Default Fallback
    return {
        "selected_data_source": "Local Processing Engine",
        "execution_mode": "LOCAL",
        "fallback_reason": None,
        "selected_dataset": "Regional GIS Vector Base",
        "analysis_pipeline": "General Spatial Analytics Engine",
        "is_real_service": False,
        "reason": "Executed via Local Processing Engine."
    }
