from typing import List, Optional
from fastapi import APIRouter, Body
from ...schemas.query_schemas import SatelliteSearchRequest
from ...schemas.response_schemas import TileInfo
from ...services.satellite_providers.provider_registry import provider_registry
from ...services.bhuvan_service import get_bhuvan_layers
from ...services.local_processing_service import SAMPLE_REGIONS

router = APIRouter()

@router.post("/satellite/search")
async def search_satellite_imagery(request: SatelliteSearchRequest = Body(...)):
    """
    Search Earth Observation STAC catalogs (Planetary Computer / Copernicus Data Space) for AOI observations.
    """
    return await provider_registry.search_best_satellite_imagery(
        bbox=request.bbox,
        from_date=request.from_date,
        to_date=request.to_date,
        sensor_type=request.sensor_type,
        max_cloud_cover=request.max_cloud_cover,
        limit=request.limit
    )

@router.get("/tiles", response_model=List[TileInfo])
async def list_satellite_tiles(region: Optional[str] = None):
    """Retrieve pre-indexed satellite footprints and metadata clearly tagged as DEMO DATA."""
    tiles = []
    for name, reg in SAMPLE_REGIONS.items():
        if region and region.lower() not in name.lower():
            continue
        tiles.append(TileInfo(
            id=f"tile-{name.lower().replace(' ', '-')}",
            tile_code=f"SAT-{name[:3].upper()}-2025",
            title=f"{name} Earth Observation Footprint",
            region_name=name,
            description=reg["description"],
            capture_date="2025-06-15",
            satellite_name=reg["default_satellite"],
            sensor_name="MSI / C-SAR",
            resolution_meters=10.0,
            bbox=reg["bbox"],
            center_lat=reg["center"][0],
            center_lon=reg["center"][1],
            cloud_cover_percentage=1.4,
            data_source_tag="DEMO DATA",
            is_demo=True,
            metadata={"source": "SATQUERY GIS Pre-Index", "crs": "EPSG:4326"}
        ))
    return tiles

@router.get("/bhuvan/layers")
async def list_bhuvan_layers():
    """Retrieve available ISRO Bhuvan WMS thematic layers."""
    return get_bhuvan_layers()
