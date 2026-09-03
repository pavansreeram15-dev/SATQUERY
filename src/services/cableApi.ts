import { fetchApi } from './api';
import { SubmarineCableCollection, LandingPointCollection, SubmarineCableDetail } from '../types/cable';
import { BBox } from '../types/map';

export const cableApi = {
  /**
   * Retrieve submarine cable routes GeoJSON matching BBOX.
   */
  async getCables(bbox?: BBox | null): Promise<SubmarineCableCollection> {
    const query = bbox && bbox.length === 4 ? `?bbox=${bbox.join(',')}` : '';
    return fetchApi<SubmarineCableCollection>(`/api/maritime/cables${query}`);
  },

  /**
   * Retrieve landing point markers GeoJSON matching BBOX.
   */
  async getLandingPoints(bbox?: BBox | null): Promise<LandingPointCollection> {
    const query = bbox && bbox.length === 4 ? `?bbox=${bbox.join(',')}` : '';
    return fetchApi<LandingPointCollection>(`/api/maritime/landing-points${query}`);
  },

  /**
   * Retrieve detailed metadata for a specific submarine cable by ID.
   */
  async getCableDetail(cableId: string): Promise<SubmarineCableDetail> {
    return fetchApi<SubmarineCableDetail>(`/api/maritime/cables/${encodeURIComponent(cableId)}`);
  },

  /**
   * Search submarine cables and landing points by query.
   */
  async search(query: string): Promise<{
    cables: Array<{ id: string; name: string; color?: string; owners?: string; length?: string; coordinates?: any }>;
    landing_points: Array<{ id: string; name: string; country?: string; coordinates?: [number, number] }>;
    total_count: number;
    query: string;
  }> {
    return fetchApi(`/api/maritime/search?q=${encodeURIComponent(query)}`);
  }
};
