import { BoundingBox } from './geo';

export interface TileInfo {
  id: string;
  tile_code: string;
  title: string;
  region_name: string;
  description: string;
  capture_date: string;
  satellite_name: string;
  sensor_name: string;
  resolution_meters: number;
  bbox: BoundingBox;
  center_lat: number;
  center_lon: number;
  cloud_cover_percentage: number;
  metadata: Record<string, any>;
}

export interface SatelliteSearchRequest {
  bbox: BoundingBox;
  from_date?: string;
  to_date?: string;
  sensor_type?: 'optical' | 'sar' | 'all';
  max_cloud_cover?: number;
  limit?: number;
}

export interface SatelliteObservation {
  id: string;
  datetime: string;
  sensor: string;
  provider: string;
  cloud_cover?: number;
  thumbnail_url?: string;
  bbox: BoundingBox;
  assets: Record<string, any>;
}

export interface ServiceStatus {
  service_name: string;
  status: string;
  is_authenticated: boolean;
  description: string;
  capabilities: string[];
}

export interface ProviderHealthItem {
  provider_name: string;
  display_name: string;
  status: string;
  auth_type: string;
  is_configured: boolean;
  last_checked: string;
  latency_ms: number;
}
