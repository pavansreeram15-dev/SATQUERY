import { fetchApi } from './api';
import { MaritimePort, MaritimeFeatureCollection } from '../types/maritime';
import { BBox } from '../types/map';

// Standardized Global Major Maritime Infrastructure Dataset
export const GLOBAL_MARITIME_PORTS: MaritimePort[] = [
  {
    id: 'port-chennai',
    name: 'Chennai Port & Container Terminal',
    code: 'INMAA',
    category: 'Deepwater Port',
    country: 'India',
    latitude: 13.105,
    longitude: 80.305,
    berth_count: 24,
    annual_traffic_teu: '5.2M TEU',
    status: 'OPERATIONAL',
    ais_vessels_detected: 48,
    description: 'Premier deepwater harbor on the Coromandel Coast with container terminals, oil docks, and cargo anchorages.',
  },
  {
    id: 'port-mumbai-jnpt',
    name: 'Jawaharlal Nehru Port (JNPT Mumbai)',
    code: 'INBOM',
    category: 'Container Terminal',
    country: 'India',
    latitude: 18.95,
    longitude: 72.95,
    berth_count: 32,
    annual_traffic_teu: '6.1M TEU',
    status: 'OPERATIONAL',
    ais_vessels_detected: 72,
    description: 'Largest container port in India, handling over 50% of the total containerized cargo across major Indian ports.',
  },
  {
    id: 'port-kochi',
    name: 'Cochin Port & Vallarpadam ICTT',
    code: 'INKOC',
    category: 'Container Terminal',
    country: 'India',
    latitude: 9.965,
    longitude: 76.27,
    berth_count: 18,
    annual_traffic_teu: '1.2M TEU',
    status: 'OPERATIONAL',
    ais_vessels_detected: 29,
    description: 'Strategic Arabian Sea international container transshipment terminal on primary global east-west shipping lanes.',
  },
  {
    id: 'port-vizag',
    name: 'Visakhapatnam Deepwater Port',
    code: 'INVTZ',
    category: 'Deepwater Port',
    country: 'India',
    latitude: 17.685,
    longitude: 83.295,
    berth_count: 28,
    annual_traffic_teu: '3.8M TEU',
    status: 'OPERATIONAL',
    ais_vessels_detected: 34,
    description: 'Natural deepwater harbor on the Bay of Bengal serving strategic naval, iron ore, petroleum, and cargo operations.',
  },
  {
    id: 'port-singapore',
    name: 'Port of Singapore Megaport (Tuas/PSA)',
    code: 'SGSIN',
    category: 'Container Terminal',
    country: 'Singapore',
    latitude: 1.283,
    longitude: 103.85,
    berth_count: 67,
    annual_traffic_teu: '39.0M TEU',
    status: 'OPERATIONAL',
    ais_vessels_detected: 215,
    description: 'World top transshipment hub connecting over 600 ports in 120 countries at the Malacca Strait.',
  },
  {
    id: 'port-rotterdam',
    name: 'Port of Rotterdam Gateway',
    code: 'NLRTM',
    category: 'Deepwater Port',
    country: 'Netherlands',
    latitude: 51.924,
    longitude: 4.477,
    berth_count: 90,
    annual_traffic_teu: '14.5M TEU',
    status: 'OPERATIONAL',
    ais_vessels_detected: 142,
    description: 'Largest seaport in Europe with automated container terminals, petrochemical refining, and deep sea access.',
  },
  {
    id: 'port-shanghai',
    name: 'Shanghai International Port (Yangshan)',
    code: 'CNSHA',
    category: 'Container Terminal',
    country: 'China',
    latitude: 31.23,
    longitude: 121.47,
    berth_count: 125,
    annual_traffic_teu: '47.3M TEU',
    status: 'OPERATIONAL',
    ais_vessels_detected: 310,
    description: 'Busiest container port globally with Yangshan deepwater automated mega-terminal connected by Donghai Bridge.',
  },
  {
    id: 'port-suez',
    name: 'Suez Canal Maritime Gateway (Port Said)',
    code: 'EGPSD',
    category: 'Canal Transit Gateway',
    country: 'Egypt',
    latitude: 31.265,
    longitude: 32.302,
    berth_count: 22,
    annual_traffic_teu: '4.8M TEU',
    status: 'ACTIVE_SURVEILLANCE',
    ais_vessels_detected: 86,
    description: 'Critical international waterway enabling shortest maritime trade link between Asia, Middle East, and Europe.',
  },
  {
    id: 'port-panama',
    name: 'Panama Canal Pacific Terminal (Balboa)',
    code: 'PAPTY',
    category: 'Canal Transit Gateway',
    country: 'Panama',
    latitude: 8.955,
    longitude: -79.565,
    berth_count: 16,
    annual_traffic_teu: '3.5M TEU',
    status: 'OPERATIONAL',
    ais_vessels_detected: 64,
    description: 'Inter-oceanic canal lock system linking the Atlantic and Pacific Oceans with neo-panamax transit gates.',
  },
  {
    id: 'port-jebel-ali',
    name: 'Port of Jebel Ali (DP World Dubai)',
    code: 'AEJEA',
    category: 'Deepwater Port',
    country: 'United Arab Emirates',
    latitude: 25.01,
    longitude: 55.06,
    berth_count: 55,
    annual_traffic_teu: '14.0M TEU',
    status: 'OPERATIONAL',
    ais_vessels_detected: 98,
    description: 'Largest man-made harbor and principal maritime logistics hub across the Persian Gulf and Middle East.',
  },
  {
    id: 'port-los-angeles',
    name: 'Port of Los Angeles & Long Beach',
    code: 'USLAX',
    category: 'Container Terminal',
    country: 'United States',
    latitude: 33.74,
    longitude: -118.27,
    berth_count: 43,
    annual_traffic_teu: '10.6M TEU',
    status: 'OPERATIONAL',
    ais_vessels_detected: 112,
    description: 'Leading seaport in North America by container volume and primary trans-Pacific maritime trade gateway.',
  },
];

export const maritimeApi = {
  /**
   * Fetch maritime infrastructure ports & terminals matching active BBOX.
   */
  async getPorts(bbox?: BBox | null): Promise<MaritimeFeatureCollection> {
    try {
      const query = bbox ? `?bbox=${bbox.join(',')}` : '';
      const result = await fetchApi<MaritimeFeatureCollection>(`/api/maritime/ports${query}`);
      if (result && result.features && result.features.length > 0) {
        return result;
      }
    } catch {
      // Fallback to local dataset
    }

    // Client-side spatial filter
    let ports = GLOBAL_MARITIME_PORTS;
    if (bbox && bbox.length === 4) {
      const [minLon, minLat, maxLon, maxLat] = bbox;
      const filtered = ports.filter(
        (p) =>
          p.longitude >= minLon - 0.5 &&
          p.longitude <= maxLon + 0.5 &&
          p.latitude >= minLat - 0.5 &&
          p.latitude <= maxLat + 0.5
      );
      if (filtered.length > 0) {
        ports = filtered;
      }
    }

    const features = ports.map((p) => ({
      type: 'Feature' as const,
      id: p.id,
      geometry: {
        type: 'Point' as const,
        coordinates: [p.longitude, p.latitude] as [number, number],
      },
      properties: p,
    }));

    return {
      type: 'FeatureCollection',
      features,
      metadata: {
        total_ports: features.length,
        generated_at: new Date().toISOString(),
        source: 'SATQUERY Maritime Infrastructure Database',
      },
    };
  },

  /**
   * Search maritime ports, terminals, and harbors by name, code, or country.
   */
  async search(query: string): Promise<MaritimePort[]> {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    try {
      const result = await fetchApi<{ ports: MaritimePort[] }>(
        `/api/maritime/search?q=${encodeURIComponent(q)}`
      );
      if (result && result.ports && result.ports.length > 0) {
        return result.ports;
      }
    } catch {
      // Fallback
    }

    return GLOBAL_MARITIME_PORTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  },
};
