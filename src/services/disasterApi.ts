import { fetchApi } from './api';
import { disasterService } from './disasterService';
import { EarthEvent, DisasterSummaryResponse, DisasterProviderHealth } from '../types/disaster';

export const disasterApi = {
  /**
   * Fetch active disaster events.
   */
  async getEvents(params: {
    timeRange?: string;
    type?: string;
    source?: string;
    severity?: string;
    bbox?: string;
    limit?: number;
    format?: 'geojson' | 'json';
    forceRefresh?: boolean;
  } = {}): Promise<any> {
    return disasterService.getLiveDisasters(params);
  },

  /**
   * Fetch summary of global disaster events.
   */
  async getSummary(): Promise<DisasterSummaryResponse> {
    return disasterService.getDisasterSummary();
  },

  /**
   * Fetch disaster provider operational status.
   */
  async getProviderStatus(): Promise<DisasterProviderHealth[]> {
    return fetchApi<DisasterProviderHealth[]>('/api/disasters/providers/status');
  },

  /**
   * Inspect event details.
   */
  async getEventDetail(eventId: string): Promise<EarthEvent> {
    return disasterService.getDisasterDetail(eventId);
  }
};
