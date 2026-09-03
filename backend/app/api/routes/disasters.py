import asyncio
import json as import_json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from ...schemas.disaster_schemas import (
    EarthEvent, DisasterSummaryResponse, DisasterProviderHealth
)
from ...services.disaster_aggregator import disaster_aggregator
from ...services.disaster_scheduler import disaster_broadcaster

router = APIRouter()

@router.get("/disasters")
async def get_live_disasters(
    time_range: str = Query("24h", description="Time window: 1h, 24h, 7d, 30d, all"),
    type: Optional[str] = Query(None, description="Filter: earthquake, wildfire, cyclone, flood, volcano, tsunami, storm, drought"),
    source: Optional[str] = Query(None, description="Filter source: USGS, EONET, FIRMS, GDACS"),
    severity: Optional[str] = Query(None, description="Filter severity: small, moderate, major, severe, critical"),
    bbox: Optional[str] = Query(None, description="Spatial BBOX: min_lon,min_lat,max_lon,max_lat"),
    limit: int = Query(250, ge=1, le=1000, description="Max number of events to return"),
    format: str = Query("geojson", description="Response format: geojson (default) or json"),
    force_refresh: bool = Query(False, description="Bypass cache and force refresh upstream providers")
):
    """
    Retrieve continuously updated, normalized, and deduplicated global disaster events.
    """
    parsed_bbox: Optional[List[float]] = None
    if bbox:
        try:
            parts = [float(x.strip()) for x in bbox.split(",")]
            if len(parts) == 4:
                parsed_bbox = parts
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid bbox format. Use min_lon,min_lat,max_lon,max_lat")

    events = await disaster_aggregator.get_all_events(
        time_range=time_range,
        disaster_type=type,
        source=source,
        severity=severity,
        bbox=parsed_bbox,
        limit=limit,
        force_refresh=force_refresh
    )

    if format.lower() == "json":
        return [e.model_dump() for e in events]

    geojson_collection = disaster_aggregator.to_geojson_feature_collection(events)
    return geojson_collection.model_dump()

@router.get("/disasters/summary", response_model=DisasterSummaryResponse)
async def get_disaster_summary():
    """Return statistical summary of active global disaster events and provider health telemetry."""
    return disaster_aggregator.get_summary()

@router.get("/disasters/providers/status", response_model=List[DisasterProviderHealth])
async def get_disaster_providers_status():
    """Return operational health status for all 4 disaster providers (USGS, EONET, FIRMS, GDACS)."""
    return [p.get_health() for p in disaster_aggregator.providers]

@router.get("/disasters/live-stream")
async def disaster_live_stream(request: Request):
    """
    Server-Sent Events (SSE) stream for real-time live disaster telemetry.
    """
    queue = disaster_broadcaster.subscribe()

    async def event_generator():
        try:
            initial_events = await disaster_aggregator.get_all_events(time_range="24h")
            initial_geojson = disaster_aggregator.to_geojson_feature_collection(initial_events)
            initial_summary = disaster_aggregator.get_summary()
            
            init_payload = {
                "type": "INITIAL_DISASTERS_STATE",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "total_events": len(initial_events),
                "geojson": initial_geojson.model_dump(),
                "summary": initial_summary.model_dump()
            }
            yield f"data: {import_json.dumps(init_payload)}\n\n"

            while True:
                if await request.is_disconnected():
                    break
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=25.0)
                    yield data
                except asyncio.TimeoutError:
                    yield f": heartbeat {datetime.now(timezone.utc).isoformat()}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            disaster_broadcaster.unsubscribe(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/disasters/{event_id}", response_model=EarthEvent)
async def get_disaster_event_detail(event_id: str):
    """Inspect detailed telemetry, hypocenter depth, magnitude, and sources for a specific disaster."""
    events = await disaster_aggregator.get_all_events(time_range="30d", limit=500)
    for e in events:
        if e.id == event_id or e.source_event_id == event_id:
            return e
    raise HTTPException(status_code=404, detail=f"Disaster event '{event_id}' not found in active telemetry.")
