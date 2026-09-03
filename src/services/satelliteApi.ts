import { fetchApi } from './api';
import { TileInfo, ServiceStatus, ProviderHealthItem, SatelliteSearchRequest, SatelliteObservation } from '../types';

export const satelliteApi = {
  /**
   * Search satellite STAC catalogs.
   */
  async searchImagery(req: SatelliteSearchRequest): Promise<SatelliteObservation[]> {
    return fetchApi<SatelliteObservation[]>('/api/satellite/search', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  /**
   * List satellite tiles footprint index.
   */
  async listTiles(region?: string): Promise<TileInfo[]> {
    const query = region ? `?region=${encodeURIComponent(region)}` : '';
    return fetchApi<TileInfo[]>(`/api/tiles${query}`);
  },

  /**
   * List available ISRO Bhuvan layers.
   */
  async listBhuvanLayers(): Promise<any[]> {
    return fetchApi<any[]>('/api/bhuvan/layers');
  },

  /**
   * Get operational status of satellite connectors.
   */
  async getServiceStatuses(): Promise<ServiceStatus[]> {
    return fetchApi<ServiceStatus[]>('/api/sources/status');
  },

  /**
   * Get provider health telemetry.
   */
  async getProvidersHealth(): Promise<ProviderHealthItem[]> {
    return fetchApi<ProviderHealthItem[]>('/api/providers/health');
  }
};
