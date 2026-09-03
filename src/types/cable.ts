export interface SubmarineCableProperties {
  id: string;
  name: string;
  color: string;
  feature_id?: string;
  length_km?: number;
  rfs_year?: number; // Ready for service year
  owners?: string[];
  capacity_tbps?: number;
  landing_points_count?: number;
  url?: string;
  is_planned?: boolean;
}

export interface SubmarineCableFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'LineString' | 'MultiLineString';
    coordinates: number[][] | number[][][]; // [lon, lat]
  };
  properties: SubmarineCableProperties;
}

export interface LandingPointProperties {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  cables_count: number;
  cable_names?: string[];
}

export interface LandingPointFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
  properties: LandingPointProperties;
}

export interface SubmarineCablesGeoJSONResponse {
  type: 'FeatureCollection';
  features: SubmarineCableFeature[];
  metadata?: {
    total_cables: number;
    source: string;
    license: string;
    generated_at: string;
  };
}

export interface LandingPointsGeoJSONResponse {
  type: 'FeatureCollection';
  features: LandingPointFeature[];
  metadata?: {
    total_landing_points: number;
    source: string;
    generated_at: string;
  };
}

export interface DetailedCableInfo extends SubmarineCableProperties {
  landing_points?: LandingPointProperties[];
  notes?: string;
  suppliers?: string[];
}
