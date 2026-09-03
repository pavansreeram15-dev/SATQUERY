import { queryService } from './queryService';
import { QueryRequest, QueryResponse, ComparisonResponse, AnalyticsSummary } from '../types';

export const analysisApi = {
  /**
   * Execute natural language geospatial query.
   */
  async executeQuery(req: QueryRequest): Promise<QueryResponse> {
    return queryService.executeQuery(req);
  },

  /**
   * Execute explicit multi-temporal change detection.
   */
  async runChangeDetection(req: {
    region_name: string;
    before_year: number;
    after_year: number;
    viewport_bbox?: [number, number, number, number];
    persona: any;
  }): Promise<QueryResponse> {
    return queryService.runChangeDetection(req);
  },

  /**
   * Execute multi-temporal comparison analysis.
   */
  async executeComparison(req: {
    viewport_bbox: [number, number, number, number];
    before_date_or_year: number | string;
    after_date_or_year: number | string;
    sensor_type?: string;
    region_name?: string;
  }): Promise<ComparisonResponse> {
    return queryService.executeComparison(req);
  },

  /**
   * Fetch query execution history.
   */
  async getHistory(persona?: string, intent?: string, limit = 50): Promise<QueryResponse[]> {
    return queryService.getQueryHistory(persona, intent, limit);
  },

  /**
   * Fetch live analytics metrics summary.
   */
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    return queryService.getAnalyticsSummary();
  }
};
