export type BoundingBox = [number, number, number, number]; // [min_lon, min_lat, max_lon, max_lat]

export interface GeoJSONGeometry {
  type: string;
  coordinates: any;
}

export interface GeoJSONFeature {
  type: 'Feature';
  id?: string;
  geometry: GeoJSONGeometry;
  properties: Record<string, any>;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface LocationSearchResult {
  place_id: string;
  display_name: string;
  lat: number;
  lon: number;
  type: string;
  bbox: BoundingBox;
  importance: number;
  provider: string;
}
