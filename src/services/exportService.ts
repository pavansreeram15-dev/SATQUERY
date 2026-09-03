import { QueryResponse, GeoJSONFeatureCollection } from '../types/query';

export const exportService = {
  exportGeoJSON(dataOrCollection: QueryResponse | GeoJSONFeatureCollection, prefix: string = 'satquery') {
    const geojsonData = (dataOrCollection as QueryResponse).geojson_data || dataOrCollection;
    const jsonStr = JSON.stringify(geojsonData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/geo+json' });
    triggerDownload(blob, `${prefix}_${Date.now()}.geojson`);
  },

  exportJSON(data: any, prefix: string = 'satquery') {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    triggerDownload(blob, `${prefix}_${Date.now()}.json`);
  },

  exportCSV(dataOrCollection: QueryResponse | GeoJSONFeatureCollection, prefix: string = 'satquery') {
    let features: any[] = [];
    if ((dataOrCollection as QueryResponse).geojson_data) {
      features = (dataOrCollection as QueryResponse).geojson_data.features || [];
    } else if ((dataOrCollection as GeoJSONFeatureCollection).features) {
      features = (dataOrCollection as GeoJSONFeatureCollection).features;
    }

    if (features.length === 0) {
      const resp = dataOrCollection as QueryResponse;
      const rows = [
        ['Metric', 'Value'],
        ['Query ID', resp.query_id || 'N/A'],
        ['Prompt', `"${(resp.prompt || '').replace(/"/g, '""')}"`],
        ['Intent', resp.intent || 'N/A'],
        ['Data Source', resp.data_source || 'N/A'],
        ['Persona', resp.persona || 'N/A'],
        ['Processing Time (ms)', (resp.processing_time_ms || 0).toString()],
        ['Timestamp', resp.created_at || new Date().toISOString()],
      ];
      if (resp.metrics) {
        Object.entries(resp.metrics).forEach(([k, v]) => {
          rows.push([k, typeof v === 'object' ? JSON.stringify(v) : String(v)]);
        });
      }
      const csvContent = rows.map((r) => r.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      triggerDownload(blob, `${prefix}_summary_${Date.now()}.csv`);
      return;
    }

    // Extract all unique property keys from features
    const allKeys = Array.from(
      new Set(
        features.flatMap((f) => [
          'id',
          'geometry_type',
          ...Object.keys(f.properties || {}),
        ])
      )
    );

    const headerRow = allKeys.join(',');
    const dataRows = features.map((f) => {
      return allKeys
        .map((k) => {
          let val = '';
          if (k === 'id') val = f.id || '';
          else if (k === 'geometry_type') val = f.geometry?.type || '';
          else val = f.properties && f.properties[k] !== undefined ? String(f.properties[k]) : '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    const csvContent = [headerRow, ...dataRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `${prefix}_features_${Date.now()}.csv`);
  },

  exportReport(data: QueryResponse) {
    const report = `========================================================================
SATQUERY AI — MULTIMODAL SATELLITE INTELLIGENCE ADVISORY
========================================================================

REPORT ID: ADVISORY-${data.query_id}
TIMESTAMP: ${new Date().toISOString()}
OPERATIONAL PERSONA: ${data.persona}
DATA SOURCE: ${data.data_source} (${data.dataset_name || 'Calibrated Matrix'})
PRIMARY INTENT: ${data.intent}

------------------------------------------------------------------------
EXECUTIVE CONCLUSION
------------------------------------------------------------------------
${data.summary_text}

------------------------------------------------------------------------
EVIDENCE FUSION & TELEMETRY
------------------------------------------------------------------------
• SATELLITE SENSOR: ${data.evidence_breakdown?.satellite_evidence?.sensor || 'Sentinel-2 MSI / Sentinel-1 SAR'}
• SPATIAL RESOLUTION: ${data.evidence_breakdown?.satellite_evidence?.resolution || '10m GSD'}
• WEATHER CONTEXT: ${data.evidence_breakdown?.weather_evidence?.summary || 'Open-Meteo Ambient Baseline'}
• WHY THIS RESULT: ${data.why_this_result || 'Derived from calibrated spectral and spatial reflectance models.'}
• LIMITATIONS: ${data.limitations || 'Constrained by 10m ground sample distance and atmospheric conditions.'}

------------------------------------------------------------------------
QUANTITATIVE METRICS
------------------------------------------------------------------------
${Object.entries(data.metrics || {})
  .map(([k, v]) => `• ${k.replace(/_/g, ' ').toUpperCase()}: ${v}`)
  .join('\n')}

------------------------------------------------------------------------
EXECUTION PIPELINE
------------------------------------------------------------------------
${(data.execution_pipeline || []).map((step) => `[x] ${step}`).join('\n')}

========================================================================
Datum / Coordinate Reference System: WGS84 (EPSG:4326)
Total Georeferenced Features: ${data.geojson_data?.features?.length || 0}
========================================================================
`;
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
    triggerDownload(blob, `SATQUERY_Advisory_${data.query_id}.txt`);
  },

  // Backwards compatibility wrappers
  downloadGeoJSON(data: QueryResponse) {
    this.exportGeoJSON(data, `SATQUERY_${data.intent}_${data.query_id}`);
  },
  downloadJSON(data: QueryResponse) {
    this.exportJSON(data, `SATQUERY_Analysis_${data.query_id}`);
  },
  downloadCSV(data: QueryResponse) {
    this.exportCSV(data, `SATQUERY_Detections_${data.query_id}`);
  },
  downloadDisasterReport(data: QueryResponse) {
    this.exportReport(data);
  }
};

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
