import { UserPersona } from './persona';

export type BBox = [number, number, number, number]; // [min_lon, min_lat, max_lon, max_lat] in EPSG:4326

export type LatLngCoord = [number, number]; // [lat, lng]

export type MapProvider = 'MAPBOX' | 'OPENSTREETMAP' | 'FALLBACK';

export type BasemapType = 'dark' | 'satellite' | 'street' | 'topo';

export type DrawModeType = 'box' | 'polygon' | null;

export type ComparisonViewMode = 'slider' | 'side-by-side';

export interface BhuvanLayerConfig {
  id: string;
  name: string;
  serviceUrl: string;
  layerName: string;
  format?: string;
  transparent?: boolean;
  attribution?: string;
  category: string;
  enabled: boolean;
  allowedPersonas: UserPersona[];
}

export interface MapLayerPermission {
  layerId: string;
  allowedPersonas: UserPersona[];
  requiresBackend?: boolean;
}

export interface ActiveLayerState {
  basemap: BasemapType;
  liveDisasters: boolean;
  detections: boolean;
  flood: boolean;
  ndvi: boolean;
  ndwi: boolean;
  change: boolean;
  bhuvanLulc: boolean;
  bhuvanFlood: boolean;
  bhuvanWasteland: boolean;
  bhuvanGeomorph: boolean;
  bboxDrawMode: boolean;
  splitComparison: boolean;
  liveAisVessels?: boolean;
  aisSatelliteCorrelation?: boolean;
}
