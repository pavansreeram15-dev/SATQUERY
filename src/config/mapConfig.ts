import { BasemapType, BhuvanLayerConfig } from '../types/map';

export const BASEMAP_TILES: Record<
  BasemapType,
  { name: string; url: string; attribution: string; maxZoom: number; subdomains?: string }
> = {
  dark: {
    name: 'Mission Dark (ESRI / Carto)',
    url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 19,
  },
  satellite: {
    name: 'High-Res Satellite (ESRI)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
  },
  street: {
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  topo: {
    name: 'ESRI Topographic Terrain',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
    maxZoom: 19,
  },
};

export const BHUVAN_LAYERS_CONFIG: BhuvanLayerConfig[] = [
  {
    id: 'bhuvanLulc',
    name: 'ISRO Bhuvan LULC 50K (Land Use/Land Cover)',
    serviceUrl: 'https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms',
    layerName: 'lulc:LULC50K_1516',
    attribution: 'ISRO / NRSC Bhuvan Geospatial Services',
    category: 'Thematic',
    enabled: false,
    allowedPersonas: ['ISRO_ANALYST', 'PUBLIC_RESEARCHER'],
  },
  {
    id: 'bhuvanFlood',
    name: 'ISRO Bhuvan Flood Hazard & Inundation Map',
    serviceUrl: 'https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms',
    layerName: 'disaster:flood_hazard_india',
    attribution: 'ISRO / NRSC Disaster Management Programme',
    category: 'Disaster',
    enabled: false,
    allowedPersonas: ['ISRO_ANALYST', 'NDRF_OFFICER'],
  },
  {
    id: 'bhuvanWasteland',
    name: 'ISRO Bhuvan Wastelands Atlas',
    serviceUrl: 'https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms',
    layerName: 'wasteland:WL50K_1516',
    attribution: 'ISRO / Dept of Land Resources',
    category: 'Thematic',
    enabled: false,
    allowedPersonas: ['ISRO_ANALYST', 'PUBLIC_RESEARCHER'],
  },
  {
    id: 'bhuvanGeomorph',
    name: 'ISRO Bhuvan Geomorphology & Lineaments',
    serviceUrl: 'https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms',
    layerName: 'geomorph:GM50K_1516',
    attribution: 'ISRO / Geological Survey of India',
    category: 'Geology',
    enabled: false,
    allowedPersonas: ['ISRO_ANALYST'],
  },
];
