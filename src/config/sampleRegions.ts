import { BBox } from '../types/map';

export interface SampleRegion {
  id: string;
  name: string;
  category: 'Maritime' | 'Disaster' | 'Urban' | 'Ecological' | 'Strategic';
  center: [number, number]; // [lat, lon] for Leaflet
  zoom: number;
  bbox: BBox; // [min_lon, min_lat, max_lon, max_lat]
  description: string;
  defaultPrompt: string;
  recommendedPersona: 'ISRO_ANALYST' | 'NDRF_OFFICER' | 'PUBLIC_RESEARCHER';
  satelliteName: string;
}

export const SAMPLE_REGIONS: SampleRegion[] = [
  {
    id: 'chennai-port',
    name: 'Chennai Port',
    category: 'Maritime',
    center: [13.1050, 80.3050],
    zoom: 14,
    bbox: [80.2700, 13.0700, 80.3400, 13.1400],
    description: 'Deep-water harbor, container berths, oil terminals & cargo anchorages.',
    defaultPrompt: 'Count all cargo ships in this harbor',
    recommendedPersona: 'ISRO_ANALYST',
    satelliteName: 'Sentinel-2 MSI (10m Optical)',
  },
  {
    id: 'assam-flood',
    name: 'Assam Flood Region',
    category: 'Disaster',
    center: [26.2150, 91.7900],
    zoom: 12,
    bbox: [91.7000, 26.1500, 91.8800, 26.2800],
    description: 'Brahmaputra River basin and monsoon seasonal flood inundation corridor.',
    defaultPrompt: 'Highlight flooded areas',
    recommendedPersona: 'NDRF_OFFICER',
    satelliteName: 'Sentinel-1 SAR C-Band (Cloud-Penetrating)',
  },
  {
    id: 'bengaluru-urban',
    name: 'Bengaluru Urban Region',
    category: 'Urban',
    center: [12.9500, 77.6700],
    zoom: 13,
    bbox: [77.6200, 12.9000, 77.7200, 13.0000],
    description: 'High-density tech corridor, Outer Ring Road & rapid urban expansion.',
    defaultPrompt: 'Show urban expansion between 2023 and 2025',
    recommendedPersona: 'ISRO_ANALYST',
    satelliteName: 'Sentinel-2 & Landsat-9 Multi-temporal',
  },
  {
    id: 'sundarbans',
    name: 'Sundarbans',
    category: 'Ecological',
    center: [21.9250, 88.9000],
    zoom: 11,
    bbox: [88.7500, 21.8000, 89.0500, 22.0500],
    description: 'World UNESCO mangrove biosphere reserve and complex estuarine tidal channels.',
    defaultPrompt: 'Calculate vegetation health',
    recommendedPersona: 'PUBLIC_RESEARCHER',
    satelliteName: 'Sentinel-2 Multi-Spectral Reflectance',
  },
  {
    id: 'mumbai-coastal',
    name: 'Mumbai Coastal Region',
    category: 'Maritime',
    center: [18.9600, 72.8900],
    zoom: 13,
    bbox: [72.8200, 18.9000, 72.9600, 19.0200],
    description: 'Mumbai Harbor, JNPT container terminal and coastal reclamation zones.',
    defaultPrompt: 'Count storage tanks and ships in this harbor',
    recommendedPersona: 'ISRO_ANALYST',
    satelliteName: 'Sentinel-2 High-Resolution Optical',
  },
  {
    id: 'kochi-port',
    name: 'Kochi Coastal Region',
    category: 'Maritime',
    center: [9.9650, 76.2700],
    zoom: 13,
    bbox: [76.2200, 9.9300, 76.3200, 10.0000],
    description: 'Vallarpadam International Container Transshipment Terminal and backwaters.',
    defaultPrompt: 'Find water bodies and detect harbor vessels',
    recommendedPersona: 'PUBLIC_RESEARCHER',
    satelliteName: 'Sentinel-2 Optical & SAR',
  },
  {
    id: 'kerala-monsoon',
    name: 'Kerala Flood & Landslide Zone',
    category: 'Disaster',
    center: [11.6050, 76.1320],
    zoom: 12,
    bbox: [76.0500, 11.5200, 76.2200, 11.6900],
    description: 'Wayanad, Western Ghats catchment and extreme southwest monsoon inundation corridors.',
    defaultPrompt: 'Analyze flood inundation and landslide risk with Sentinel-1 SAR',
    recommendedPersona: 'NDRF_OFFICER',
    satelliteName: 'Sentinel-1 SAR Dual-Pol (Cloud-Penetrating)',
  },
  {
    id: 'delhi-urban',
    name: 'Delhi Urban Region',
    category: 'Urban',
    center: [28.6139, 77.2090],
    zoom: 12,
    bbox: [77.1000, 28.5200, 77.3200, 28.7000],
    description: 'National Capital Region, Yamuna floodplain and built-up land use changes.',
    defaultPrompt: 'Compare land cover and urban density between 2022 and 2026',
    recommendedPersona: 'PUBLIC_RESEARCHER',
    satelliteName: 'Sentinel-2 & Bhuvan LULC',
  },
];
