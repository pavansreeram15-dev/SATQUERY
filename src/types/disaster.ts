export type DisasterType =
  | 'earthquake'
  | 'wildfire'
  | 'cyclone'
  | 'flood'
  | 'volcano'
  | 'tsunami'
  | 'storm'
  | 'drought'
  | 'other';

export type DisasterSeverity = 'small' | 'moderate' | 'major' | 'severe' | 'critical';

export type DisasterAlertLevel = 'green' | 'yellow' | 'orange' | 'red' | 'white';

export interface EarthEvent {
  id: string;
  source: 'USGS' | 'EONET' | 'FIRMS' | 'GDACS' | string;
  sources: string[];
  source_event_id?: string;

  type: DisasterType;
  title: string;
  description?: string;

  latitude: number;
  longitude: number;

  magnitude?: number;
  depth_km?: number;

  severity: DisasterSeverity;
  alert_level: DisasterAlertLevel;
  confidence?: number;

  start_time?: string;
  updated_time?: string;
  end_time?: string;

  country?: string;
  region?: string;

  source_url?: string;
  geometry?: {
    type: string;
    coordinates: any;
  };
  raw_source?: Record<string, any>;
}

export interface DisasterGeoJSONFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: {
    id: string;
    title: string;
    description?: string;
    type: DisasterType;
    source: string;
    sources: string[];
    magnitude?: number;
    depth_km?: number;
    severity: DisasterSeverity;
    alert_level: DisasterAlertLevel;
    confidence?: number;
    start_time?: string;
    updated_time?: string;
    country?: string;
    region?: string;
    source_url?: string;
    latitude: number;
    longitude: number;
  };
}

export interface DisasterFeatureCollection {
  type: 'FeatureCollection';
  features: DisasterGeoJSONFeature[];
  metadata?: {
    total_events: number;
    generated_at: string;
    crs?: string;
    attribution?: string;
  };
}

export interface DisasterProviderHealth {
  provider_name: string;
  status: string;
  last_poll_time?: string;
  event_count: number;
  poll_interval_seconds: number;
  requires_api_key: boolean;
  is_authenticated: boolean;
  error_message?: string;
}

export interface DisasterSummaryResponse {
  total_active_events: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  providers: DisasterProviderHealth[];
  last_updated: string;
}

export type TimeRangeOption = '1h' | '24h' | '7d' | '30d' | 'all';

export interface DisasterFilterState {
  timeRange: TimeRangeOption;
  selectedTypes: DisasterType[];
  selectedSeverities: DisasterSeverity[];
  selectedSource: string; // 'ALL' | 'USGS' | 'EONET' | 'FIRMS' | 'GDACS'
  searchQuery: string;
}
