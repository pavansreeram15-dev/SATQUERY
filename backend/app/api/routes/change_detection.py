from fastapi import APIRouter, Body
from ...schemas.query_schemas import ChangeDetectionRequest, ComparisonRequest, QueryRequest
from ...schemas.response_schemas import QueryResponse
from ...services.temporal_comparison_service import temporal_comparison_service
from .analysis import execute_geospatial_query

router = APIRouter()

@router.post("/change-detection", response_model=QueryResponse)
async def run_explicit_change_detection(request: ChangeDetectionRequest = Body(...)):
    """Dedicated endpoint for multi-temporal before/after change comparisons."""
    query_req = QueryRequest(
        prompt=f"Compare satellite changes and urban expansion between {request.before_year} and {request.after_year} in {request.region_name}",
        viewport_bbox=request.viewport_bbox,
        persona=request.persona,
        before_year=request.before_year,
        after_year=request.after_year,
        target_classes=["urban", "vegetation", "water"]
    )
    return await execute_geospatial_query(query_req)

@router.post("/comparison")
async def run_temporal_comparison(request: ComparisonRequest = Body(...)):
    """
    Dedicated Multi-Temporal Satellite Comparison Endpoint.
    Computes verified before vs after deltas (vegetation, water, urban built-up, SAR inundation).
    """
    return await temporal_comparison_service.execute_comparison(
        bbox=request.viewport_bbox,
        before_date_or_year=request.before_date_or_year,
        after_date_or_year=request.after_date_or_year,
        sensor_type=request.sensor_type,
        region_name=request.region_name
    )
