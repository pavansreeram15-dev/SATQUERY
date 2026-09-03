import { exportService } from './exportService';
import { QueryResponse } from '../types';

export const reportApi = {
  /**
   * Export query analysis to GeoJSON file.
   */
  exportGeoJSON(result: QueryResponse): void {
    exportService.exportGeoJSON(result);
  },

  /**
   * Export query metrics to CSV file.
   */
  exportCSV(result: QueryResponse): void {
    exportService.exportCSV(result);
  },

  /**
   * Export query result features to KML file for GIS software.
   */
  exportKML(result: QueryResponse): void {
    exportService.exportKML(result);
  },

  /**
   * Generate comprehensive PDF executive briefing report.
   */
  async exportPDF(result: QueryResponse): Promise<void> {
    return exportService.exportPDF(result);
  }
};
