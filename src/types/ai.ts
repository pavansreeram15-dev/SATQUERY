export interface AIBriefRequest {
  query: string;
  region_name?: string;
  intent?: string;
  metrics?: Record<string, any>;
  weather_context?: Record<string, any>;
  wiki_context?: Record<string, any>;
}

export interface AIBriefResponse {
  query: string;
  region_name: string;
  brief: string;
}

export interface WikiKnowledgeResponse {
  query: string;
  knowledge: {
    place_name?: string;
    summary?: string;
    url?: string;
    coordinates?: { lat: number; lon: number };
  };
}

export interface ExecutionTraceStep {
  step_number: number;
  description: string;
  timestamp: string;
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
}

export interface MetricDerivation {
  metric: string;
  source: string;
  computation: string;
  unit: string;
}

// ==========================================
// ISRO SIH26167 Remote Sensing VLM Types
// ==========================================

export type BoundingBox2D = [number, number, number, number]; // [ymin, xmin, ymax, xmax] in 0–1000 scale

export interface GroundedObject {
  id: string;
  label: string;
  box_2d: BoundingBox2D;
  confidence: number;
  area_ha?: number;
  attributes?: Record<string, any>;
}

export interface RSVLMAnalysisResult {
  mode: 'SINGLE_VQA';
  caption: string;
  vqa_answer: string;
  confidence: number;
  spectral_indices?: {
    NDVI_mean?: number;
    NDWI_mean?: number;
    built_up_index?: number;
    EVI?: number;
    SAVI?: number;
    sar_vv_db?: number;
    [key: string]: any;
  };
  grounded_objects: GroundedObject[];
  metric_derivations?: MetricDerivation[];
  geojson?: {
    type: 'FeatureCollection';
    features: any[];
  };
  total_grounded_count?: number;
  benchmark_metrics?: {
    benchmark_name: string;
    bleu_4: number;
    cider: number;
    miou_grounding: number;
    vqa_exact_match: string;
  };
  reasoning_steps?: string[];
  processing_time_ms: number;
  engine_mode?: string;
  task_intent?: string;
}

export interface ChangeCluster {
  id: string;
  change_type: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  box_2d: BoundingBox2D;
  area_ha: number;
  confidence: number;
  t1_state: string;
  t2_state: string;
  description: string;
}

export interface ChangeDetectionResult {
  mode: 'BITEMPORAL_CHANGE';
  title: string;
  benchmark_dataset: string;
  t1_observation: {
    date: string;
    sensor: string;
    status: string;
  };
  t2_observation: {
    date: string;
    sensor: string;
    status: string;
  };
  change_caption: string;
  vqa_answer: string;
  overall_change_percentage: number;
  total_impacted_area_km2: number;
  difference_map_b64?: string;
  change_mask_b64?: string;
  sector_damage_breakdown: Record<string, any>;
  metric_derivations?: MetricDerivation[];
  change_clusters: ChangeCluster[];
  cdvqa_metrics: {
    bleu_4: number;
    cider: number;
    f1_score: number;
    change_detection_accuracy: string;
  };
  geojson?: {
    type: 'FeatureCollection';
    features: any[];
  };
  total_change_clusters?: number;
  processing_time_ms: number;
  engine_mode?: string;
  task_intent?: string;
}

export interface FusedDetection {
  id: string;
  label: string;
  fusion_mode: string;
  box_2d: BoundingBox2D;
  area_ha: number;
  confidence: number;
  optical_visible: boolean;
  sar_backscatter_db: number;
  description: string;
}

export interface OpticalSARFusionResult {
  mode: 'OPTICAL_SAR_FUSION';
  title: string;
  sensors: {
    optical: string;
    sar: string;
    spatial_resolution: string;
  };
  cloud_penetration_summary: {
    optical_cloud_occlusion: string;
    sar_penetration_efficacy: string;
    cloud_penetration_gain: string;
  };
  fusion_reasoning: string;
  vqa_answer: string;
  fused_image_b64?: string;
  polarization_telemetry: {
    vv_backscatter_mean_db: number;
    vh_backscatter_mean_db: number;
    min_backscatter_db?: number;
    max_backscatter_db?: number;
    std_backscatter_db?: number;
    specular_water_coverage_pct?: number;
    lee_filter_window: string;
    speckle_suppression_ratio: string;
  };
  metric_derivations?: MetricDerivation[];
  fused_detections: FusedDetection[];
  fusion_metrics: {
    co_registration_rmse_m: number;
    fusion_f1_score: number;
    miou_flood_delineation: number;
    sih26167_compliance: string;
  };
  geojson?: {
    type: 'FeatureCollection';
    features: any[];
  };
  total_fused_targets?: number;
  processing_time_ms: number;
  engine_mode?: string;
  task_intent?: string;
}

export type RSVLMUniversalResult = RSVLMAnalysisResult | ChangeDetectionResult | OpticalSARFusionResult;

export interface BenchmarkPreset {
  id: string;
  title: string;
  category: 'OPTICAL_SAR_FUSION' | 'BITEMPORAL_CHANGE' | 'GROUNDED_VQA';
  tag: string;
  description: string;
  sensors: string[];
  location: string;
  default_query: string;
  thumbnail: string;
  optical_image?: string;
  sar_image?: string;
  t1_image?: string;
  t2_image?: string;
  image_url?: string;
  t1_date?: string;
  t2_date?: string;
  viewport_bbox: [number, number, number, number];
  ground_truth_metrics: Record<string, any>;
}

export interface AgentStepTrace {
  step: number;
  title: string;
  module: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  durationMs?: number;
  details?: string;
}
