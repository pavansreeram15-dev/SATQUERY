import { fetchApi } from './api';
import { AISVessel, AISFilterState, AISCorrelationMatch, AISStatusResponse } from '../types/ais';
import { BBox } from '../types/map';

export const aisApi = {
  /**
   * Retrieve live AIS vessels for the active map viewport BBOX and filter parameters.
   */
  async getVessels(bbox?: BBox | null, filters?: Partial<AISFilterState>): Promise<AISVessel[]> {
    const params = new URLSearchParams();
    if (bbox && bbox.length === 4) {
      params.append('bbox', bbox.join(','));
    }
    if (filters?.selectedTypes && filters.selectedTypes.length > 0) {
      params.append('ship_types', filters.selectedTypes.join(','));
    }
    if (filters?.speedRange && filters.speedRange !== 'ALL') {
      if (filters.speedRange === '0-5') {
        params.append('min_speed', '0');
        params.append('max_speed', '5');
      } else if (filters.speedRange === '5-10') {
        params.append('min_speed', '5');
        params.append('max_speed', '10');
      } else if (filters.speedRange === '10-20') {
        params.append('min_speed', '10');
        params.append('max_speed', '20');
      } else if (filters.speedRange === '20+') {
        params.append('min_speed', '20');
      }
    }
    if (filters?.navStatus && filters.navStatus !== 'ALL') {
      params.append('nav_status', filters.navStatus);
    }
    if (filters?.searchQuery) {
      params.append('q', filters.searchQuery);
    }

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<AISVessel[]>(`/api/ais/vessels${queryStr}`);
  },

  /**
   * Search live vessels globally by MMSI, Name, or IMO.
   */
  async searchVessels(query: string) {
    return fetchApi<{ vessels: AISVessel[]; matched_count: number; search_query: string }>(
      `/api/ais/search?q=${encodeURIComponent(query)}`
    );
  },

  /**
   * Fetch live AIS connection status.
   */
  async getStatus(): Promise<AISStatusResponse> {
    return fetchApi<AISStatusResponse>('/api/ais/status');
  },

  /**
   * Perform spatial & temporal correlation between satellite ship detections and live AIS telemetry.
   */
  async correlateSatellite(features: any[], bbox?: BBox | null): Promise<AISCorrelationMatch[]> {
    return fetchApi<AISCorrelationMatch[]>('/api/ais/correlation', {
      method: 'POST',
      body: JSON.stringify({ features, bbox }),
    });
  }
};
