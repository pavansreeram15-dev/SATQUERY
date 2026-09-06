"""
SATQUERY AI — Agent Task Router & Multimodal Intent Dispatcher
ISRO SIH26167 Compliant Remote Sensing Orchestration Engine.

Routes user queries to the appropriate specialist RS pipeline:
1. SINGLE_VQA / OBJECT_GROUNDING -> RSVLMService (Gemini Vision / Dynamic CV Grounding)
2. BITEMPORAL_CHANGE_VQA -> ChangeAgentService (Pixel Delta, Otsu Mask, ChangeCLIP)
3. OPTICAL_SAR_FUSION -> OpticalSARFusionService (Dual-Sensor Composite, dB Telemetry)
"""

import time
import re
import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger("satquery.agent_router")

class AgentTaskRouter:
    """Intelligent intent classifier and pipeline orchestrator for Remote Sensing VLM tasks."""

    TASK_SINGLE_VQA = "SINGLE_VQA"
    TASK_BITEMPORAL_CHANGE = "BITEMPORAL_CHANGE"
    TASK_OPTICAL_SAR_FUSION = "OPTICAL_SAR_FUSION"
    TASK_GROUNDING = "OBJECT_GROUNDING"

    def classify_intent(self, query: str, explicit_mode: Optional[str] = None) -> str:
        """
        Classify remote-sensing query intent using natural language keyword and semantic patterns.
        Respects explicit user-selected mode if provided, otherwise infers dynamically.
        """
        if explicit_mode:
            mode_upper = explicit_mode.upper().strip()
            if mode_upper in ("BITEMPORAL_CHANGE", "CHANGE", "BITEMPORAL_CHANGE_VQA"):
                return self.TASK_BITEMPORAL_CHANGE
            if mode_upper in ("OPTICAL_SAR_FUSION", "FUSION", "SAR_FUSION"):
                return self.TASK_OPTICAL_SAR_FUSION
            if mode_upper in ("GROUNDING", "OBJECT_GROUNDING"):
                return self.TASK_GROUNDING
            if mode_upper in ("SINGLE_VQA", "VQA", "SINGLE"):
                return self.TASK_SINGLE_VQA

        q_lower = (query or "").lower().strip()

        # 1. Bi-Temporal Change Detection & Damage Assessment Keywords
        change_keywords = [
            "change", "delta", "before and after", "t1", "t2", "pre-event", "post-event",
            "pre-monsoon", "post-monsoon", "damage assessment", "inundated area surge",
            "expansion", "deforestation", "destruction", "submergence", "altered", "breach"
        ]
        if any(kw in q_lower for kw in change_keywords):
            return self.TASK_BITEMPORAL_CHANGE

        # 2. Optical-SAR Fusion & Microwave Penetration Keywords
        fusion_keywords = [
            "sar", "radar", "risat", "sentinel-1", "backscatter", "c-band", "vv/vh",
            "polarization", "penetrate cloud", "cloud-penetrating", "cloud occlusion",
            "all-weather", "dielectric", "optical-sar", "fused", "co-registered"
        ]
        if any(kw in q_lower for kw in fusion_keywords):
            return self.TASK_OPTICAL_SAR_FUSION

        # 3. Object Grounding / Spatial Localization
        grounding_keywords = [
            "locate", "ground", "bounding box", "find all", "detect all", "count all",
            "where is", "where are", "coordinates", "pinpoint"
        ]
        if any(kw in q_lower for kw in grounding_keywords):
            return self.TASK_GROUNDING

        # 4. Default to Single-Image VQA
        return self.TASK_SINGLE_VQA

    def validate_inputs(self, task_type: str, request_data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Ensure all required rasters and imagery inputs are supplied before invoking specialist models.
        Prevents hallucinated or fabricated results when necessary inputs are missing.
        """
        if task_type == self.TASK_BITEMPORAL_CHANGE:
            t1_img = request_data.get("t1_image")
            t2_img = request_data.get("t2_image")
            image_data = request_data.get("image_data")
            preset_id = request_data.get("preset_id")

            if not (t1_img and t2_img) and not (preset_id and preset_id.startswith("cdvqa")) and not image_data:
                return False, "Bi-Temporal Change-VQA requires both T1 (Pre-event) and T2 (Post-event) satellite rasters. Please provide both images."

        elif task_type == self.TASK_OPTICAL_SAR_FUSION:
            optical_img = request_data.get("optical_image")
            sar_img = request_data.get("sar_image")
            preset_id = request_data.get("preset_id")
            image_data = request_data.get("image_data")

            if not (optical_img and sar_img) and not (preset_id and "cartosat" in preset_id) and not image_data:
                return False, "Optical-SAR Fusion requires co-registered Optical and SAR microwave radar rasters. Please provide both inputs."

        elif task_type in (self.TASK_SINGLE_VQA, self.TASK_GROUNDING):
            image_data = request_data.get("image_data")
            image_url = request_data.get("image_url")
            preset_id = request_data.get("preset_id")

            if not image_data and not image_url and not preset_id:
                return False, "Single-Image VQA requires a satellite raster (upload or select benchmark preset)."

        return True, None

    def build_initial_trace(self, task_type: str, query: str) -> List[Dict[str, Any]]:
        """Construct deterministic execution telemetry trace steps."""
        now = time.strftime("%H:%M:%S")
        return [
            {
                "step": 1,
                "title": "Agent Intent Classification & Validation",
                "module": "AgentTaskRouter",
                "status": "SUCCESS",
                "durationMs": 12,
                "details": f"Classified query into [{task_type}] pipeline. Validated raster inputs."
            },
            {
                "step": 2,
                "title": "Multimodal Raster Ingestion & Tensor Processing",
                "module": "RasterEngine (Pillow/NumPy)",
                "status": "RUNNING",
                "durationMs": 0,
                "details": "Decoding satellite imagery and preparing raster tensors."
            },
            {
                "step": 3,
                "title": "Specialist Vision-Language Model Inference",
                "module": "RS-VLM / Gemini 3.7 Vision Head",
                "status": "PENDING",
                "durationMs": 0,
                "details": "Awaiting grounding, captioning, and metric derivation."
            },
            {
                "step": 4,
                "title": "WGS84 Projection & Metric Provenance Synthesis",
                "module": "PostGIS / GeoJSON Serializer",
                "status": "PENDING",
                "durationMs": 0,
                "details": "Structuring calibrated outputs with explicit metric derivations."
            }
        ]

agent_task_router = AgentTaskRouter()
