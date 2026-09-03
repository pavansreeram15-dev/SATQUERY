import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QueryResponse, GeoJSONFeatureCollection } from '../types/query';

export const exportService = {
  /**
   * Export query analysis to GeoJSON file.
   */
  exportGeoJSON(dataOrCollection: QueryResponse | GeoJSONFeatureCollection, prefix: string = 'satquery') {
    const geojsonData = (dataOrCollection as QueryResponse).geojson_data || dataOrCollection;
    const jsonStr = JSON.stringify(geojsonData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/geo+json' });
    triggerDownload(blob, `${prefix}_${Date.now()}.geojson`);
  },

  /**
   * Export raw analysis data to JSON.
   */
  exportJSON(data: any, prefix: string = 'satquery') {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    triggerDownload(blob, `${prefix}_${Date.now()}.json`);
  },

  /**
   * Export metrics or feature properties to CSV.
   */
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

  /**
   * Generate and download high-resolution PDF Executive Intelligence Advisory.
   */
  async exportPDF(data: QueryResponse, filenamePrefix: string = 'SATQUERY_Advisory'): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;

    // 1. Header Banner
    doc.setFillColor(3, 7, 18); // Space 950
    doc.rect(0, 0, pageWidth, 75, 'F');

    // Cyan Accent Line
    doc.setFillColor(6, 182, 212); // Cyan 500
    doc.rect(0, 75, pageWidth, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('SATQUERY.AI', margin, 38);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(6, 182, 212);
    doc.text('MULTIMODAL SATELLITE INTELLIGENCE ADVISORY', margin, 54);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const dateStr = new Date().toUTCString();
    doc.text(`CONFIDENTIAL • ${dateStr}`, pageWidth - margin, 46, { align: 'right' });

    let currentY = 100;

    // 2. Metadata Table
    const metaData = [
      [
        { content: 'REPORT ID:', styles: { fontStyle: 'bold' as const, textColor: [100, 116, 139] } },
        `ADVISORY-${data.query_id || 'N/A'}`,
        { content: 'OPERATIONAL PERSONA:', styles: { fontStyle: 'bold' as const, textColor: [100, 116, 139] } },
        `${data.persona || 'GENERAL_EXPLORER'}`,
      ],
      [
        { content: 'INTENT:', styles: { fontStyle: 'bold' as const, textColor: [100, 116, 139] } },
        `${data.intent || 'GENERAL_ANALYSIS'}`,
        { content: 'DATA SOURCE:', styles: { fontStyle: 'bold' as const, textColor: [100, 116, 139] } },
        `${data.data_source || 'Sentinel-2 / SAR'}`,
      ],
      [
        { content: 'QUERY PROMPT:', styles: { fontStyle: 'bold' as const, textColor: [100, 116, 139] } },
        { content: `"${data.prompt || 'Autonomous Survey'}"`, colSpan: 3 },
      ],
    ];

    autoTable(doc, {
      startY: currentY,
      body: metaData,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: [30, 41, 59],
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // 3. Executive Summary Section
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, currentY, contentWidth, 65, 4, 4, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, contentWidth, 65, 4, 4, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(8, 145, 178); // Cyan 600
    doc.text('EXECUTIVE CONCLUSION', margin + 12, currentY + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const summaryLines = doc.splitTextToSize(data.summary_text || 'Satellite observation completed successfully.', contentWidth - 24);
    doc.text(summaryLines.slice(0, 3), margin + 12, currentY + 34);

    currentY += 80;

    // 4. Evidence Breakdown: Satellite & Environmental Context
    const breakdown = data.evidence_breakdown;
    const weather = data.weather_context;

    const evidenceRows: any[] = [];
    if (breakdown?.satellite_evidence) {
      evidenceRows.push([
        'Satellite Sensor & Resolution',
        `${breakdown.satellite_evidence.sensor || 'Sentinel-2 MSI'} (${breakdown.satellite_evidence.resolution || '10m GSD'})`,
      ]);
      if (breakdown.satellite_evidence.cloud_cover) {
        evidenceRows.push(['Cloud Cover Assessment', breakdown.satellite_evidence.cloud_cover]);
      }
    }
    if (weather || breakdown?.weather_evidence) {
      const cond = weather?.weather_condition || breakdown?.weather_evidence?.conditions || 'Telemetry Active';
      const temp = weather?.temperature_celsius ? `${weather.temperature_celsius}°C` : 'N/A';
      const rain = weather?.rainfall_7d_total_mm ? `${weather.rainfall_7d_total_mm} mm` : 'Normal Baseline';
      evidenceRows.push(['Environmental Conditions', `${cond} (Temp: ${temp}, 7d Rain: ${rain})`]);
    }
    if (data.why_this_result) {
      evidenceRows.push(['Analytical Methodology', data.why_this_result]);
    }
    if (data.limitations) {
      evidenceRows.push(['Operational Limitations', data.limitations]);
    }

    if (evidenceRows.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('EVIDENCE FUSION & OBSERVATION MATRIX', margin, currentY);
      currentY += 8;

      autoTable(doc, {
        startY: currentY,
        head: [['Dimension', 'Observation Telemetry']],
        body: evidenceRows,
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8.5,
          cellPadding: 5,
          textColor: [51, 65, 85],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: margin, right: margin },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // 5. Quantitative Telemetry Metrics Table
    if (data.metrics && Object.keys(data.metrics).length > 0) {
      const metricRows = Object.entries(data.metrics).map(([k, v]) => [
        k.replace(/_/g, ' ').toUpperCase(),
        typeof v === 'object' ? JSON.stringify(v) : String(v),
      ]);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('QUANTITATIVE SENSOR METRICS', margin, currentY);
      currentY += 8;

      autoTable(doc, {
        startY: currentY,
        head: [['Metric Indicator', 'Measured Value']],
        body: metricRows,
        theme: 'grid',
        headStyles: {
          fillColor: [8, 145, 178], // Cyan 600
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8.5,
          cellPadding: 4,
          textColor: [30, 41, 59],
        },
        margin: { left: margin, right: margin },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // 6. Execution Pipeline & Verification Checklist
    if (data.execution_pipeline && data.execution_pipeline.length > 0) {
      if (currentY + 60 > pageHeight - 50) {
        doc.addPage();
        currentY = margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('EXECUTION AUDIT PIPELINE', margin, currentY);
      currentY += 12;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);

      data.execution_pipeline.forEach((step) => {
        doc.text(`[x]  ${step}`, margin + 5, currentY);
        currentY += 12;
      });
    }

    // 7. Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);

      // Horizontal line above footer
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);

      doc.text('SATQUERY.AI • Autonomous Planetary Intelligence Briefing', margin, pageHeight - 18);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 18, { align: 'right' });
    }

    // Trigger download
    const filename = `${filenamePrefix}_${data.query_id || Date.now()}.pdf`;
    doc.save(filename);
  },

  /**
   * Plain text report export.
   */
  exportReport(data: QueryResponse) {
    this.exportPDF(data);
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
    this.exportPDF(data);
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
