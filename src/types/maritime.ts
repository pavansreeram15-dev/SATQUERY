export type MaritimeCategory =
  | 'Deepwater Port'
  | 'Container Terminal'
  | 'Oil & LNG Jetty'
  | 'Canal Transit Gateway'
  | 'Naval Dockyard';

export type MaritimeOperationalStatus =
  | 'OPERATIONAL'
  | 'CONGESTED'
  | 'ACTIVE_SURVEILLANCE'
  | 'RESTRICTED';

export interface MaritimePort {
  id: string;
  name: string;
  code: string; // UN/LOCODE
  category: MaritimeCategory;
  country: string;
  latitude: number;
  longitude: number;
  berth_count: number;
  annual_traffic_teu: string;
  status: MaritimeOperationalStatus;
  ais_vessels_detected: number;
  description: string;
}

export interface MaritimeGeoJSONFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
  properties: MaritimePort;
}

export interface MaritimeFeatureCollection {
  type: 'FeatureCollection';
  features: MaritimeGeoJSONFeature[];
  metadata: {
    total_ports: number;
    generated_at: string;
    source: string;
  };
}
