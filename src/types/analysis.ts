import { UserPersona } from './persona';
import { GeoJSONFeatureCollection, GeoJSONGeometry, BoundingBox } from './geo';

export type QueryIntent =
  | 'OBJECT_COUNT'
  | 'OBJECT_DETECTION'
  | 'SEGMENT_TERRAIN'
  | 'FLOOD_DETECTION'
  | 'CHANGE_DETECTION'
  | 'SPECTRAL_ANALYSIS'
  | 'NDVI_ANALYSIS'
  | 'NDWI_ANALYSIS'
  | 'GENERAL_GIS_VQA';

export interface QueryRequest {
  prompt: string;
  tile_id?: string;
  viewport_bbox?: BoundingBox;
  aoi_geometry?: GeoJSONGeometry;
  persona: UserPersona;
  before_year?: number;
  after_year?: number;
  target_classes?: string[];
}

export interface EvidenceBreakdown {
  satellite_evidence?: {
    source?: string;
    dataset?: string;
    sensor?: string;
    resolution?: string;
    cloud_cover?: string;
    observation_mode?: string;
  };
  weather_evidence?: {
    source?: string;
    conditions?: string;
    temperature_celsius?: number;
    humidity_percent?: number;
    rainfall_7d_mm?: number;
    summary?: string;
  };
  temporal_evidence?: {
    timestamp?: string;
    before_epoch?: number | string;
    after_epoch?: number | string;
    revisit_schedule?: string;
  };
}

export interface WeatherContext {
  success: boolean;
  source: string;
  latitude: number;
  longitude: number;
  weather_condition: string;
  temperature_celsius: number;
  relative_humidity_percent: number;
  wind_speed_kmh: number;
  current_rain_mm: number;
  rainfall_7d_total_mm: number;
  is_heavy_rain: boolean;
  summary: string;
  daily_precipitation_series?: number[];
}

export interface ComparisonMetrics {
  total_changed_km2: number;
  change_percentage: number;
  built_up_expansion_km2?: number;
  vegetation_loss_km2?: number;
  water_extent_delta_km2?: number;
  mean_ndvi_before?: number;
  mean_ndvi_after?: number;
  mean_ndvi_delta?: number;
}

export interface ComparisonObservation {
  date: string;
  year?: number;
  sensor: string;
  cloud_cover_percent?: number;
  satellite_id?: string;
}

export interface ComparisonResponse {
  success: boolean;
  aoi_area_km2: number;
  before_observation: ComparisonObservation;
  after_observation: ComparisonObservation;
  change_metrics: ComparisonMetrics;
  summary_text: string;
  feature_collection: GeoJSONFeatureCollection;
  revisit_schedule?: Record<string, any>;
  confidence: number;
  processing_time_ms: number;
}

export interface QueryResponse {
  success?: boolean;
  query?: string;
  query_id: string;
  prompt: string;
  user_query?: string;
  detected_region?: string;
  intent_confidence?: number;
  persona: UserPersona;
  intent: QueryIntent;
  target_classes: string[];
  data_source: string;
  execution_mode?: 'LIVE' | 'FALLBACK' | 'LOCAL' | 'DEMO';
  fallback_reason?: string | null;
  dataset?: string;
  dataset_name: string;
  is_real_service: boolean;
  status?: 'NORMAL' | 'WATCH' | 'HIGH_RISK' | 'CRITICAL' | 'EMERGENCY_EVACUATION' | 'INSUFFICIENT_DATA' | 'DEMO' | string;
  severity?: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | string;
  evidence?: Record<string, any>;
  evidence_breakdown?: EvidenceBreakdown;
  weather_context?: WeatherContext;
  why_this_result?: string;
  limitations?: string;
  analysis_type?: string;
  is_demo?: boolean;
  aoi?: Record<string, any>;
  date_range?: Record<string, any>;
  analysis?: Record<string, any>;
  statistics?: Record<string, any>;
  summary_text: string;
  count_metric?: number;
  average_confidence?: number;
  confidence?: number | null;
  geojson?: GeoJSONFeatureCollection;
  geojson_data: GeoJSONFeatureCollection;
  metrics: Record<string, any>;
  comparison_data?: ComparisonResponse | null;
  processing_time_ms: number;
  execution_pipeline: string[];
  metadata: Record<string, any>;
  timestamp?: string;
  audit_id?: string;
  created_at: string;
}
