import asyncio
from backend.app.services.ai.rs_vlm_service import rs_vlm_service
from backend.app.services.ai.change_agent_service import change_agent_service
from backend.app.services.ai.optical_sar_fusion_service import optical_sar_fusion_service
from backend.app.services.ai.dataset_benchmark_service import dataset_benchmark_service

def test_rs_vlm_single_vqa_and_grounding():
    async def run():
        res = await rs_vlm_service.analyze_single_image_vqa(
            query="Count and locate commercial aircraft on the apron",
            preset_id="vrsbench-airport",
            viewport_bbox=[77.68, 13.18, 77.73, 13.22]
        )
        assert res is not None
        assert "vqa_answer" in res
        assert "grounded_objects" in res
        assert len(res["grounded_objects"]) > 0
        for obj in res["grounded_objects"]:
            box = obj["box_2d"]
            assert len(box) == 4
            assert 0 <= box[0] <= 1000
            assert 0 <= box[1] <= 1000
            assert 0 <= box[2] <= 1000
            assert 0 <= box[3] <= 1000
        assert "geojson" in res
        assert res["geojson"]["type"] == "FeatureCollection"
        assert len(res["geojson"]["features"]) == len(res["grounded_objects"])
    asyncio.run(run())

def test_bitemporal_change_agent():
    async def run():
        res = await change_agent_service.analyze_bitemporal_change(
            query="What changed between baseline and flood event?",
            preset_id="cdvqa-assam-flood",
            viewport_bbox=[92.80, 26.30, 93.20, 26.70]
        )
        assert res is not None
        assert "change_caption" in res
        assert "overall_change_percentage" in res
        assert res["overall_change_percentage"] > 0
        assert "change_clusters" in res
        assert len(res["change_clusters"]) > 0
        assert "geojson" in res
    asyncio.run(run())

def test_optical_sar_fusion():
    async def run():
        res = await optical_sar_fusion_service.fuse_optical_sar_pair(
            query="Delineate flood extents beneath cloud cover",
            preset_id="isro-cartosat-risat",
            viewport_bbox=[92.75, 26.20, 93.15, 26.60]
        )
        assert res is not None
        assert "cloud_penetration_summary" in res
        assert "fused_detections" in res
        assert len(res["fused_detections"]) > 0
        assert "geojson" in res
    asyncio.run(run())

def test_dataset_benchmarks():
    benchmarks = dataset_benchmark_service.list_benchmarks()
    assert len(benchmarks) >= 5
    ids = [b["id"] for b in benchmarks]
    assert "isro-cartosat-risat" in ids
    assert "cdvqa-assam-flood" in ids
    assert "vrsbench-airport" in ids
