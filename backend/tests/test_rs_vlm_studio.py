import asyncio
import unittest
from backend.app.services.ai.rs_vlm_service import rs_vlm_service
from backend.app.services.ai.change_agent_service import change_agent_service
from backend.app.services.ai.optical_sar_fusion_service import optical_sar_fusion_service
from backend.app.services.ai.dataset_benchmark_service import dataset_benchmark_service

class TestRSVLMStudio(unittest.TestCase):
    def test_rs_vlm_single_vqa_and_grounding(self):
        async def run():
            res = await rs_vlm_service.analyze_single_image_vqa(
                query="Count and locate commercial aircraft on the apron",
                preset_id="vrsbench-airport",
                viewport_bbox=[77.68, 13.18, 77.73, 13.22]
            )
            self.assertIsNotNone(res)
            self.assertIn("vqa_answer", res)
            self.assertIn("grounded_objects", res)
            self.assertGreater(len(res["grounded_objects"]), 0)
            for obj in res["grounded_objects"]:
                box = obj["box_2d"]
                self.assertEqual(len(box), 4)
                self.assertTrue(0 <= box[0] <= 1000)
                self.assertTrue(0 <= box[1] <= 1000)
                self.assertTrue(0 <= box[2] <= 1000)
                self.assertTrue(0 <= box[3] <= 1000)
            self.assertIn("geojson", res)
            self.assertEqual(res["geojson"]["type"], "FeatureCollection")
            self.assertEqual(len(res["geojson"]["features"]), len(res["grounded_objects"]))
        asyncio.run(run())

    def test_bitemporal_change_agent(self):
        async def run():
            res = await change_agent_service.analyze_bitemporal_change(
                query="What changed between baseline and flood event?",
                preset_id="cdvqa-assam-flood",
                viewport_bbox=[92.80, 26.30, 93.20, 26.70]
            )
            self.assertIsNotNone(res)
            self.assertIn("change_caption", res)
            self.assertIn("overall_change_percentage", res)
            self.assertGreater(res["overall_change_percentage"], 0)
            self.assertIn("change_clusters", res)
            self.assertGreater(len(res["change_clusters"]), 0)
            self.assertIn("geojson", res)
        asyncio.run(run())

    def test_optical_sar_fusion(self):
        async def run():
            res = await optical_sar_fusion_service.fuse_optical_sar_pair(
                query="Delineate flood extents beneath cloud cover",
                preset_id="isro-cartosat-risat",
                viewport_bbox=[92.75, 26.20, 93.15, 26.60]
            )
            self.assertIsNotNone(res)
            self.assertIn("cloud_penetration_summary", res)
            self.assertIn("fused_detections", res)
            self.assertGreater(len(res["fused_detections"]), 0)
            self.assertIn("geojson", res)
        asyncio.run(run())

    def test_dataset_benchmarks(self):
        benchmarks = dataset_benchmark_service.list_benchmarks()
        self.assertGreaterEqual(len(benchmarks), 5)
        ids = [b["id"] for b in benchmarks]
        self.assertIn("isro-cartosat-risat", ids)
        self.assertIn("cdvqa-assam-flood", ids)
        self.assertIn("vrsbench-airport", ids)

if __name__ == "__main__":
    unittest.main()

