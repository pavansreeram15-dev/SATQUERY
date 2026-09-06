from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Query, Body, HTTPException
from ...services.knowledge_service import knowledge_service
from ...services.ai.rs_vlm_service import rs_vlm_service
from ...services.ai.change_agent_service import change_agent_service
from ...services.ai.optical_sar_fusion_service import optical_sar_fusion_service
from ...services.ai.dataset_benchmark_service import dataset_benchmark_service
from ...services.ai.agent_router import agent_task_router

router = APIRouter()

# ---------------------------------------------------------------------
# Knowledge & Wikipedia Routes (Retained)
# ---------------------------------------------------------------------
@router.get("/knowledge/wiki")
async def get_wikipedia_knowledge(
    q: Optional[str] = Query(None, description="Region, city, river, or place name"),
    lat: Optional[float] = Query(None, description="Latitude coordinate"),
    lon: Optional[float] = Query(None, description="Longitude coordinate")
):
    """
    Fetch factual geographical, topographical, and demographic context via official MediaWiki GeoSearch API.
    """
    if lat is not None and lon is not None:
        wiki_info = await knowledge_service.get_wikipedia_geosearch(lat=lat, lon=lon)
        return {"query": q or f"({lat}, {lon})", "knowledge": wiki_info}
    elif q:
        wiki_info = await knowledge_service.get_wikipedia_summary(query_or_place=q)
        return {"query": q, "knowledge": wiki_info}
    
    return {"query": None, "knowledge": {"status": "NO_DATA", "message": "Latitude and longitude or query parameter required."}}

@router.post("/knowledge/brief")
async def get_ai_knowledge_brief(request: Dict[str, Any] = Body(...)):
    """
    Synthesize multi-paragraph scientific intelligence briefing via Google Gemini or local engine.
    """
    query = request.get("query", "")
    region_name = request.get("region_name", "Survey Area")
    intent = request.get("intent", "GENERAL_GIS_VQA")
    metrics = request.get("metrics", {})
    weather = request.get("weather_context")
    wiki = request.get("wiki_context")

    brief = await knowledge_service.generate_gemini_descriptive_brief(
        query=query,
        region_name=region_name,
        intent=intent,
        metrics=metrics,
        weather_context=weather,
        wiki_context=wiki
    )
    return {"query": query, "region_name": region_name, "brief": brief}

# ---------------------------------------------------------------------
# ISRO SIH26167 Remote Sensing VLM & Specialist Models Routes
# ---------------------------------------------------------------------
@router.get("/rs-vlm/benchmarks")
async def list_rs_vlm_benchmarks():
    """
    Retrieve pre-packaged ISRO & academic remote-sensing benchmark datasets for 1-click evaluation:
    - ISRO Cartosat-2S & RISAT-1A Co-registered Pair
    - CDVQA Assam Brahmaputra Flood (T1 vs T2)
    - BigEarthNet-MM Multispectral LULC
    - VRSBench Airport & Aircraft Visual Grounding
    - RSVQA Deepwater Maritime Fleet
    """
    benchmarks = dataset_benchmark_service.list_benchmarks()
    return {
        "success": True,
        "count": len(benchmarks),
        "benchmarks": benchmarks
    }

@router.post("/rs-vlm/analyze")
async def analyze_rs_vlm_multimodal(request: Dict[str, Any] = Body(...)):
    """
    Universal Multimodal Remote Sensing VLM router with Agent Task Router verification.
    Routes to:
    - Single-Image Grounded VQA (RS-VLM + VRSBench / RSVQA / BigEarthNet)
    - Bi-Temporal Change-VQA (Change-Agent + CDVQA T1 vs T2)
    - Optical-SAR Cross-Modal Fusion (Cartosat-2S + RISAT-1A / Sentinel-1+2)
    """
    requested_mode = request.get("mode")
    query = request.get("query", "Analyze remote sensing imagery")
    viewport_bbox = request.get("viewport_bbox")
    preset_id = request.get("preset_id")

    # 1. Intent Classification & Router Dispatch
    task_intent = agent_task_router.classify_intent(query=query, explicit_mode=requested_mode)

    # 2. Input Validation (Ensures required imagery exists before invoking models)
    is_valid, err_msg = agent_task_router.validate_inputs(task_intent, request)
    if not is_valid:
        raise HTTPException(status_code=400, detail=err_msg)

    # 3. Route to Specialist Pipeline
    if task_intent == agent_task_router.TASK_BITEMPORAL_CHANGE:
        t1_img = request.get("t1_image")
        t2_img = request.get("t2_image")
        t1_date = request.get("t1_date", "2024-05-10")
        t2_date = request.get("t2_date", "2026-08-18")

        result = await change_agent_service.analyze_bitemporal_change(
            query=query,
            t1_image=t1_img,
            t2_image=t2_img,
            t1_date=t1_date,
            t2_date=t2_date,
            viewport_bbox=viewport_bbox,
            preset_id=preset_id
        )
        result["mode"] = "BITEMPORAL_CHANGE"
        result["task_intent"] = task_intent
        return {"success": True, "data": result}

    elif task_intent == agent_task_router.TASK_OPTICAL_SAR_FUSION:
        optical_img = request.get("optical_image")
        sar_img = request.get("sar_image")

        result = await optical_sar_fusion_service.fuse_optical_sar_pair(
            query=query,
            optical_image=optical_img,
            sar_image=sar_img,
            viewport_bbox=viewport_bbox,
            preset_id=preset_id
        )
        result["mode"] = "OPTICAL_SAR_FUSION"
        result["task_intent"] = task_intent
        return {"success": True, "data": result}

    else:
        # Default: Single-Image Grounded VQA
        image_data = request.get("image_data")
        image_url = request.get("image_url")
        target_classes = request.get("target_classes")

        result = await rs_vlm_service.analyze_single_image_vqa(
            query=query,
            image_data=image_data,
            image_url=image_url,
            viewport_bbox=viewport_bbox,
            preset_id=preset_id,
            target_classes=target_classes
        )
        result["mode"] = "SINGLE_VQA"
        result["task_intent"] = task_intent
        return {"success": True, "data": result}

@router.post("/rs-vlm/grounding")
async def execute_visual_grounding(request: Dict[str, Any] = Body(...)):
    """
    Interactive Visual Grounding endpoint returning normalized [ymin, xmin, ymax, xmax] boxes
    and EPSG:4326 GeoJSON polygons for queried classes.
    """
    query = request.get("query", "Locate and ground targets")
    image_data = request.get("image_data")
    image_url = request.get("image_url")
    viewport_bbox = request.get("viewport_bbox")
    preset_id = request.get("preset_id")
    target_classes = request.get("target_classes", [])

    result = await rs_vlm_service.analyze_single_image_vqa(
        query=query,
        image_data=image_data,
        image_url=image_url,
        viewport_bbox=viewport_bbox,
        preset_id=preset_id,
        target_classes=target_classes
    )
    return {
        "success": True,
        "query": query,
        "grounded_objects": result.get("grounded_objects", []),
        "geojson": result.get("geojson"),
        "total_count": result.get("total_grounded_count", 0),
        "processing_time_ms": result.get("processing_time_ms", 120)
    }
