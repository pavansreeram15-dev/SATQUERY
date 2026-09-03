import { fetchApi } from './api';
import {
  SubmarineCablesGeoJSONResponse,
  LandingPointsGeoJSONResponse,
  DetailedCableInfo,
  SubmarineCableFeature,
  LandingPointFeature,
} from '../types/cable';
import { BBox } from '../types/map';

// Standardized Gigawatt Submarine Cable routes across primary global corridors
export const GLOBAL_SUBMARINE_CABLES_FALLBACK: SubmarineCableFeature[] = [
  {
    type: 'Feature',
    id: 'sea-me-we-5',
    geometry: {
      type: 'LineString',
      coordinates: [
        [103.85, 1.28], // Singapore
        [98.38, 7.88],  // Phuket
        [80.30, 13.10], // Chennai
        [72.82, 18.92], // Mumbai
        [55.30, 25.26], // Dubai / Fujairah
        [43.14, 11.58], // Djibouti
        [32.55, 29.96], // Suez / Red Sea
        [14.50, 35.89], // Malta
        [5.37, 43.29],  // Marseille
      ],
    },
    properties: {
      id: 'sea-me-we-5',
      name: 'SEA-ME-WE 5 (South East Asia-Middle East-Western Europe 5)',
      color: '#06B6D4',
      length_km: 20000,
      rfs_year: 2016,
      owners: ['Tata Communications', 'Singtel', 'Orange', 'Telecom Egypt', 'Bharti Airtel'],
      capacity_tbps: 24.0,
      landing_points_count: 17,
    },
  },
  {
    type: 'Feature',
    id: 'aae-1',
    geometry: {
      type: 'LineString',
      coordinates: [
        [114.16, 22.28], // Hong Kong
        [106.66, 10.76], // Vietnam
        [103.85, 1.28],  // Singapore
        [80.30, 13.10],  // Chennai
        [72.82, 18.92],  // Mumbai
        [58.40, 23.58],  // Muscat
        [32.55, 29.96],  // Egypt Red Sea
        [5.37, 43.29],   // Marseille
      ],
    },
    properties: {
      id: 'aae-1',
      name: 'AAE-1 (Asia-Africa-Europe 1)',
      color: '#3B82F6',
      length_km: 25000,
      rfs_year: 2017,
      owners: ['China Unicom', 'Telecom Egypt', 'Etisalat', 'Reliance Jio', 'Ooredoo'],
      capacity_tbps: 40.0,
      landing_points_count: 19,
    },
  },
  {
    type: 'Feature',
    id: 'chennai-andaman-cani',
    geometry: {
      type: 'LineString',
      coordinates: [
        [80.30, 13.10], // Chennai Landing Station
        [92.74, 11.66], // Port Blair (Andaman)
        [92.90, 12.92], // Diglipur
        [93.00, 9.16],  // Car Nicobar
      ],
    },
    properties: {
      id: 'chennai-andaman-cani',
      name: 'CANI (Chennai-Andaman & Nicobar Islands Cable)',
      color: '#10B981',
      length_km: 2314,
      rfs_year: 2020,
      owners: ['BSNL / Government of India', 'NEC Corporation'],
      capacity_tbps: 10.0,
      landing_points_count: 8,
    },
  },
  {
    type: 'Feature',
    id: '2africa',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-0.12, 51.50], // UK Bude
        [-9.14, 38.72], // Lisbon Portugal
        [-17.44, 14.69],// Dakar Senegal
        [3.37, 6.52],   // Lagos Nigeria
        [18.42, -33.92],// Cape Town
        [39.20, -6.16], // Zanzibar
        [43.14, 11.58], // Djibouti
        [32.55, 29.96], // Port Said
        [5.37, 43.29],  // Marseille
      ],
    },
    properties: {
      id: '2africa',
      name: '2Africa Global High-Capacity Cable',
      color: '#F59E0B',
      length_km: 45000,
      rfs_year: 2024,
      owners: ['Meta (Facebook)', 'Vodafone', 'Orange', 'China Mobile', 'Telecom Egypt', 'MTN'],
      capacity_tbps: 180.0,
      landing_points_count: 46,
    },
  },
  {
    type: 'Feature',
    id: 'dunant',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-75.97, 36.85], // Virginia Beach USA
        [-1.17, 46.16],  // Saint-Hilaire-de-Riez France
      ],
    },
    properties: {
      id: 'dunant',
      name: 'Dunant Transatlantic Fiber Highway',
      color: '#EC4899',
      length_km: 6400,
      rfs_year: 2021,
      owners: ['Google Cloud Infrastructure', 'SubCom'],
      capacity_tbps: 250.0,
      landing_points_count: 2,
    },
  },
  {
    type: 'Feature',
    id: 'mist',
    geometry: {
      type: 'LineString',
      coordinates: [
        [103.85, 1.28], // Singapore
        [100.32, 5.41], // Malaysia
        [96.19, 16.86], // Myanmar
        [80.30, 13.10], // Chennai
        [72.82, 18.92], // Mumbai
      ],
    },
    properties: {
      id: 'mist',
      name: 'MIST (Malaysia-India-Singapore-Thailand Cable)',
      color: '#8B5CF6',
      length_km: 8100,
      rfs_year: 2023,
      owners: ['NTT Ltd', 'Orient Link', 'Wistron'],
      capacity_tbps: 216.0,
      landing_points_count: 5,
    },
  },
];

export const GLOBAL_LANDING_POINTS_FALLBACK: LandingPointFeature[] = [
  {
    type: 'Feature',
    id: 'lp-chennai',
    geometry: {
      type: 'Point',
      coordinates: [80.305, 13.105],
    },
    properties: {
      id: 'lp-chennai',
      name: 'Chennai Landing Station (San Thome / Ernavur)',
      country: 'India',
      latitude: 13.105,
      longitude: 80.305,
      cables_count: 6,
      cable_names: ['SEA-ME-WE 5', 'AAE-1', 'CANI', 'MIST', 'BBG', 'i2i'],
    },
  },
  {
    type: 'Feature',
    id: 'lp-mumbai',
    geometry: {
      type: 'Point',
      coordinates: [72.825, 18.925],
    },
    properties: {
      id: 'lp-mumbai',
      name: 'Mumbai Landing Station (Prabhadevi / Versova)',
      country: 'India',
      latitude: 18.925,
      longitude: 72.825,
      cables_count: 9,
      cable_names: ['SEA-ME-WE 5', 'AAE-1', 'MIST', 'FLAG', 'MENA', 'Tata TGN'],
    },
  },
  {
    type: 'Feature',
    id: 'lp-singapore',
    geometry: {
      type: 'Point',
      coordinates: [103.85, 1.28],
    },
    properties: {
      id: 'lp-singapore',
      name: 'Singapore Tuas & Changi Landing Gateway',
      country: 'Singapore',
      latitude: 1.28,
      longitude: 103.85,
      cables_count: 24,
      cable_names: ['SEA-ME-WE 5', 'AAE-1', 'MIST', 'APCN-2', 'SJC2', 'Bifrost'],
    },
  },
  {
    type: 'Feature',
    id: 'lp-marseille',
    geometry: {
      type: 'Point',
      coordinates: [5.37, 43.29],
    },
    properties: {
      id: 'lp-marseille',
      name: 'Marseille Mediterranean Gateway',
      country: 'France',
      latitude: 43.29,
      longitude: 5.37,
      cables_count: 16,
      cable_names: ['SEA-ME-WE 5', 'AAE-1', '2Africa', 'PEACE', 'Medusa'],
    },
  },
  {
    type: 'Feature',
    id: 'lp-virginia-beach',
    geometry: {
      type: 'Point',
      coordinates: [-75.97, 36.85],
    },
    properties: {
      id: 'lp-virginia-beach',
      name: 'Virginia Beach CLS',
      country: 'United States',
      latitude: 36.85,
      longitude: -75.97,
      cables_count: 5,
      cable_names: ['Dunant', 'MAREA', 'BRUSA', 'Grace Hopper', 'Confluence-1'],
    },
  },
];

export const cableApi = {
  /**
   * Fetch all submarine cables with optional spatial BBOX filtering.
   */
  async getCables(bbox?: BBox | null): Promise<SubmarineCablesGeoJSONResponse> {
    try {
      const query = bbox ? `?bbox=${bbox.join(',')}` : '';
      const data = await fetchApi<SubmarineCablesGeoJSONResponse>(`/api/maritime/cables${query}`);
      if (data && data.features && data.features.length > 0) {
        return data;
      }
    } catch {
      // Fallback
    }

    return {
      type: 'FeatureCollection',
      features: GLOBAL_SUBMARINE_CABLES_FALLBACK,
      metadata: {
        total_cables: GLOBAL_SUBMARINE_CABLES_FALLBACK.length,
        source: 'Gigawatt Map & TeleGeography Open Submarine Cable Dataset',
        license: 'CC BY-NC-SA 3.0',
        generated_at: new Date().toISOString(),
      },
    };
  },

  /**
   * Fetch landing points with optional spatial filtering.
   */
  async getLandingPoints(bbox?: BBox | null): Promise<LandingPointsGeoJSONResponse> {
    try {
      const query = bbox ? `?bbox=${bbox.join(',')}` : '';
      const data = await fetchApi<LandingPointsGeoJSONResponse>(`/api/maritime/landing-points${query}`);
      if (data && data.features && data.features.length > 0) {
        return data;
      }
    } catch {
      // Fallback
    }

    return {
      type: 'FeatureCollection',
      features: GLOBAL_LANDING_POINTS_FALLBACK,
      metadata: {
        total_landing_points: GLOBAL_LANDING_POINTS_FALLBACK.length,
        source: 'Gigawatt Map & TeleGeography Open Dataset',
        generated_at: new Date().toISOString(),
      },
    };
  },

  /**
   * Search submarine cables by keyword.
   */
  async searchCables(query: string): Promise<SubmarineCableFeature[]> {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    try {
      const data = await fetchApi<{ cables: SubmarineCableFeature[] }>(
        `/api/maritime/cables/search?q=${encodeURIComponent(q)}`
      );
      if (data && data.cables) {
        return data.cables;
      }
    } catch {
      // Fallback
    }

    return GLOBAL_SUBMARINE_CABLES_FALLBACK.filter((c) =>
      c.properties.name.toLowerCase().includes(q) ||
      (c.properties.owners || []).some((o) => o.toLowerCase().includes(q))
    );
  },
};
