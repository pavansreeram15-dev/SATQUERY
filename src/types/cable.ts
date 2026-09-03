export interface CableProperties {
  id: string;
  name: string;
  color?: string;
  feature_id?: string;
  owners?: string;
  length?: string;
  rfs?: string;
  rfs_year?: number;
  is_planned?: boolean;
  source: string;
}

export interface SubmarineCableFeature {
  type: 'Feature';
  properties: CableProperties;
  geometry: {
    type: 'LineString' | 'MultiLineString';
    coordinates: any;
  };
}

export interface SubmarineCableCollection {
  type: 'FeatureCollection';
  features: SubmarineCableFeature[];
  total_count: number;
  bbox_filtered: boolean;
  attribution: string;
}

export interface LandingPointProperties {
  id: string;
  name: string;
  country?: string;
  is_tbd?: boolean;
  source: string;
}

export interface LandingPointFeature {
  type: 'Feature';
  properties: LandingPointProperties;
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface LandingPointCollection {
  type: 'FeatureCollection';
  features: LandingPointFeature[];
  total_count: number;
  bbox_filtered: boolean;
  attribution: string;
}

export interface SubmarineCableDetail {
  id: string;
  name: string;
  length?: string;
  landing_points: Array<{
    id: string;
    name: string;
    country?: string;
    is_tbd?: boolean;
  }>;
  owners?: string;
  suppliers?: string;
  rfs?: string;
  rfs_year?: number;
  is_planned?: boolean;
  url?: string;
  notes?: string;
  attribution: string;
}
