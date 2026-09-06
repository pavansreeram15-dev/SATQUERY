import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QueryResponse, GeoJSONFeatureCollection } from '../types/query';
import {
  RSVLMAnalysisResult,
  ChangeDetectionResult,
  OpticalSARFusionResult,
  BenchmarkPreset,
  MetricDerivation,
} from '../types/ai';

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
  },

  /**
   * Export ISRO RS-VLM Multimodal Studio Analysis to structured CSV.
   */
  exportVLMCSV(params: {
    activeTab: 'SINGLE_VQA' | 'BITEMPORAL_CHANGE' | 'OPTICAL_SAR_FUSION';
    preset: BenchmarkPreset;
    query: string;
    vqaResult?: RSVLMAnalysisResult | null;
    changeResult?: ChangeDetectionResult | null;
    fusionResult?: OpticalSARFusionResult | null;
  }) {
    const { activeTab, preset, query, vqaResult, changeResult, fusionResult } = params;

    const answer =
      activeTab === 'SINGLE_VQA'
        ? vqaResult?.vqa_answer || ''
        : activeTab === 'BITEMPORAL_CHANGE'
        ? changeResult?.vqa_answer || ''
        : fusionResult?.vqa_answer || '';

    const caption =
      activeTab === 'SINGLE_VQA'
        ? vqaResult?.caption || ''
        : activeTab === 'BITEMPORAL_CHANGE'
        ? changeResult?.change_caption || ''
        : fusionResult?.fusion_reasoning || '';

    const rows: string[][] = [
      ['=== ISRO MULTIMODAL REMOTE SENSING VLM ADVISORY REPORT ==='],
      ['Mode', activeTab],
      ['Preset / Benchmark', preset.title],
      ['Location', preset.location],
      ['Sensors', preset.sensors.join(' + ')],
      ['User Query', `"${(query || '').replace(/"/g, '""')}"`],
      ['Synthesized Answer', `"${answer.replace(/"/g, '""')}"`],
      ['Dense Caption', `"${caption.replace(/"/g, '""')}"`],
      ['Generated At', new Date().toISOString()],
      ['Compliance Standard', 'ISRO SIH26167 Remote Sensing EO Standard'],
      [],
    ];

    // Section 1: Grounded Targets / Change Clusters / Fused Detections
    if (activeTab === 'SINGLE_VQA' && vqaResult?.grounded_objects) {
      rows.push(['=== GROUNDED SPATIAL TARGETS (VRSBENCH / RSVQA / BIGEARTHNET) ===']);
      rows.push(['Target ID', 'Classification Label', 'Confidence (%)', 'Area (ha)', 'Bounding Box [ymin xmin ymax xmax]']);
      vqaResult.grounded_objects.forEach((obj) => {
        rows.push([
          obj.id,
          `"${obj.label.replace(/"/g, '""')}"`,
          `${Math.round(obj.confidence * 100)}%`,
          obj.area_ha !== undefined ? `${obj.area_ha}` : 'N/A',
          `"[${obj.box_2d.join(', ')}]"`,
        ]);
      });
      rows.push([]);
    } else if (activeTab === 'BITEMPORAL_CHANGE' && changeResult?.change_clusters) {
      rows.push(['=== BI-TEMPORAL CHANGE CLUSTERS (CDVQA DISASTER DELTA) ===']);
      rows.push(['Cluster ID', 'Change Type', 'Severity', 'Confidence (%)', 'Area (ha)', 'T1 Baseline State', 'T2 Post-Event State', 'Description']);
      changeResult.change_clusters.forEach((cl) => {
        rows.push([
          cl.id,
          cl.change_type,
          cl.severity,
          `${Math.round(cl.confidence * 100)}%`,
          `${cl.area_ha}`,
          `"${cl.t1_state.replace(/"/g, '""')}"`,
          `"${cl.t2_state.replace(/"/g, '""')}"`,
          `"${cl.description.replace(/"/g, '""')}"`,
        ]);
      });
      rows.push([]);
    } else if (activeTab === 'OPTICAL_SAR_FUSION' && fusionResult?.fused_detections) {
      rows.push(['=== OPTICAL-SAR CROSS-MODAL FUSED DETECTIONS (CARTOSAT + RISAT) ===']);
      rows.push(['Detection ID', 'Feature Label', 'Confidence (%)', 'SAR Backscatter (dB)', 'Area (ha)', 'Optical Visible Under Clouds', 'Description']);
      fusionResult.fused_detections.forEach((fd) => {
        rows.push([
          fd.id,
          `"${fd.label.replace(/"/g, '""')}"`,
          `${Math.round(fd.confidence * 100)}%`,
          `${fd.sar_backscatter_db} dB`,
          fd.area_ha !== undefined ? `${fd.area_ha}` : 'N/A',
          fd.optical_visible ? 'YES' : 'NO (Cloud Penetrated via SAR)',
          `"${fd.description.replace(/"/g, '""')}"`,
        ]);
      });
      rows.push([]);
    }

    // Section 2: Quantitative Telemetry & Spectral Indices
    rows.push(['=== QUANTITATIVE REMOTE SENSING TELEMETRY ===']);
    rows.push(['Metric Dimension', 'Measured Value']);
    if (activeTab === 'SINGLE_VQA' && vqaResult?.spectral_indices) {
      Object.entries(vqaResult.spectral_indices).forEach(([k, v]) => {
        rows.push([k.toUpperCase(), typeof v === 'number' ? v.toFixed(4) : String(v)]);
      });
    } else if (activeTab === 'BITEMPORAL_CHANGE' && changeResult) {
      rows.push(['Overall Surface Alteration', `+${changeResult.overall_change_percentage}%`]);
      rows.push(['Total Impacted Surface Extent', `${changeResult.total_impacted_area_km2} km²`]);
      if (changeResult.sector_damage_breakdown) {
        Object.entries(changeResult.sector_damage_breakdown).forEach(([k, v]) => {
          rows.push([k.replace(/_/g, ' ').toUpperCase(), String(v)]);
        });
      }
    } else if (activeTab === 'OPTICAL_SAR_FUSION' && fusionResult) {
      rows.push(['Cloud Occlusion Level', fusionResult.cloud_penetration_summary.optical_cloud_occlusion]);
      rows.push(['SAR Penetration Surface Gain', fusionResult.cloud_penetration_summary.cloud_penetration_gain]);
      rows.push(['Mean Radar VV Backscatter', `${fusionResult.polarization_telemetry.vv_backscatter_mean_db} dB`]);
      rows.push(['Speckle Suppression Ratio', fusionResult.polarization_telemetry.speckle_suppression_ratio]);
      rows.push(['Lee Filter Window', fusionResult.polarization_telemetry.lee_filter_window]);
    }
    rows.push([]);

    // Section 3: Metric Derivations Table
    const derivations: MetricDerivation[] =
      activeTab === 'SINGLE_VQA'
        ? vqaResult?.metric_derivations || []
        : activeTab === 'BITEMPORAL_CHANGE'
        ? changeResult?.metric_derivations || []
        : fusionResult?.metric_derivations || [];

    if (derivations.length > 0) {
      rows.push(['=== METRIC DERIVATION PROVENANCE ===']);
      rows.push(['Metric Indicator', 'Source Sensor / Layer', 'Mathematical Computation', 'Derived Value']);
      derivations.forEach((md) => {
        rows.push([md.metric, md.source, `"${md.computation.replace(/"/g, '""')}"`, md.unit]);
      });
      rows.push([]);
    }

    // Section 4: Benchmark Baseline Scorecard
    rows.push(['=== BENCHMARK REFERENCE VALIDATION SCORECARD ===']);
    rows.push(['Evaluation Dimension', 'Score']);
    if (activeTab === 'SINGLE_VQA' && vqaResult?.benchmark_metrics) {
      rows.push(['mIoU Grounding Score', String(vqaResult.benchmark_metrics.miou_grounding)]);
      rows.push(['BLEU-4 Accuracy', String(vqaResult.benchmark_metrics.bleu_4)]);
      rows.push(['CIDEr Alignment', String(vqaResult.benchmark_metrics.cider)]);
      rows.push(['VQA Exact Match', vqaResult.benchmark_metrics.vqa_exact_match]);
    } else if (activeTab === 'BITEMPORAL_CHANGE' && changeResult?.cdvqa_metrics) {
      rows.push(['BLEU-4 Accuracy', String(changeResult.cdvqa_metrics.bleu_4)]);
      rows.push(['CIDEr Score', String(changeResult.cdvqa_metrics.cider)]);
      rows.push(['F1 Score', String(changeResult.cdvqa_metrics.f1_score)]);
      rows.push(['Change Detection Accuracy', changeResult.cdvqa_metrics.change_detection_accuracy]);
    } else if (activeTab === 'OPTICAL_SAR_FUSION' && fusionResult?.fusion_metrics) {
      rows.push(['Flood Delineation mIoU', String(fusionResult.fusion_metrics.miou_flood_delineation)]);
      rows.push(['Fusion F1 Score', String(fusionResult.fusion_metrics.fusion_f1_score)]);
      rows.push(['Co-Registration RMSE (m)', `${fusionResult.fusion_metrics.co_registration_rmse_m} m`]);
      rows.push(['SIH Compliance', fusionResult.fusion_metrics.sih26167_compliance]);
    }

    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `SATQUERY_ISRO_VLM_${preset.id}_${Date.now()}.csv`);
  },

  /**
   * Export ISRO RS-VLM Multimodal Studio Analysis to high-resolution Executive PDF Advisory.
   */
  async exportVLMPDF(params: {
    activeTab: 'SINGLE_VQA' | 'BITEMPORAL_CHANGE' | 'OPTICAL_SAR_FUSION';
    preset: BenchmarkPreset;
    query: string;
    vqaResult?: RSVLMAnalysisResult | null;
    changeResult?: ChangeDetectionResult | null;
    fusionResult?: OpticalSARFusionResult | null;
  }): Promise<void> {
    const { activeTab, preset, query, vqaResult, changeResult, fusionResult } = params;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;

    // 1. Top Header Banner
    doc.setFillColor(3, 7, 18); // Space 950
    doc.rect(0, 0, pageWidth, 75, 'F');

    // Cyan Accent Strip
    doc.setFillColor(6, 182, 212); // Cyan 500
    doc.rect(0, 75, pageWidth, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(255, 255, 255);
    doc.text('SATQUERY.AI', margin, 36);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(6, 182, 212);
    doc.text('ISRO MULTIMODAL REMOTE SENSING VISION-LANGUAGE MODEL ADVISORY', margin, 52);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const dateStr = new Date().toUTCString();
    doc.text(`CONFIDENTIAL • ISRO SIH26167 • ${dateStr}`, pageWidth - margin, 44, { align: 'right' });

    let currentY = 95;

    // 2. Metadata Grid Table
    const metaData = [
      [
        { content: 'PIPELINE MODE:', styles: { fontStyle: 'bold' as const, textColor: [100, 116, 139] } },
        activeTab === 'SINGLE_VQA' ? 'Single-Image Grounded VQA' : activeTab === 'BITEMPORAL_CHANGE' ? 'Bi-Temporal Disaster Change-VQA' : 'Optical-SAR Cross-Modal Fusion',
        { content: 'EVALUATION PRESET:', styles: { fontStyle: 'bold' as const, textColor: [100, 116, 139] } },
        preset.title,
      ],
      [
        { content: 'TARGET LOCATION:', styles: { fontStyle: 'bold' as const, textColor: [100, 116, 139] } },
        preset.location,
        { content: 'ACTIVE SENSORS:', styles: { fontStyle: 'bold' as const, textColor: [100, 116, 139] } },
        preset.sensors.join(' + '),
      ],
      [
        { content: 'TASK QUERY:', styles: { fontStyle: 'bold' as const, textColor: [100, 116, 139] } },
        { content: `"${query || preset.default_query}"`, colSpan: 3 },
      ],
    ];

    autoTable(doc, {
      startY: currentY,
      body: metaData,
      theme: 'plain',
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
        textColor: [30, 41, 59],
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;

    // 3. Executive VQA Synthesized Answer Callout Box
    const answer =
      activeTab === 'SINGLE_VQA'
        ? vqaResult?.vqa_answer || 'Analyzing satellite observation...'
        : activeTab === 'BITEMPORAL_CHANGE'
        ? changeResult?.vqa_answer || 'Comparing multi-temporal observations...'
        : fusionResult?.vqa_answer || 'Synthesizing Optical and SAR backscatter...';

    const caption =
      activeTab === 'SINGLE_VQA'
        ? vqaResult?.caption || ''
        : activeTab === 'BITEMPORAL_CHANGE'
        ? changeResult?.change_caption || ''
        : fusionResult?.fusion_reasoning || '';

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, currentY, contentWidth, 68, 4, 4, 'F');
    doc.setDrawColor(6, 182, 212);
    doc.roundedRect(margin, currentY, contentWidth, 68, 4, 4, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(8, 145, 178); // Cyan 600
    doc.text('RS-VLM SYNTHESIZED EXECUTIVE ANSWER', margin + 12, currentY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    const answerLines = doc.splitTextToSize(answer, contentWidth - 24);
    doc.text(answerLines.slice(0, 3), margin + 12, currentY + 32);

    currentY += 80;

    // Dense Caption
    if (caption) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('DENSE SCIENTIFIC SCENE DESCRIPTION:', margin, currentY);
      currentY += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const capLines = doc.splitTextToSize(caption, contentWidth);
      doc.text(capLines.slice(0, 3), margin, currentY);
      currentY += capLines.slice(0, 3).length * 10 + 10;
    }

    // 4. Feature Delineation / Grounded Targets Table
    let tableHead: string[][] = [];
    let tableBody: string[][] = [];
    let tableTitle = '';

    if (activeTab === 'SINGLE_VQA' && vqaResult?.grounded_objects && vqaResult.grounded_objects.length > 0) {
      tableTitle = 'VISUAL GROUNDING & TARGET LOCALIZATION (VRSBENCH / RSVQA)';
      tableHead = [['Target ID', 'Classification Label', 'Confidence', 'Spatial Area', 'Bounding Box 2D']];
      tableBody = vqaResult.grounded_objects.map((obj) => [
        obj.id,
        obj.label,
        `${Math.round(obj.confidence * 100)}%`,
        obj.area_ha !== undefined ? `${obj.area_ha} ha` : 'N/A',
        `[${obj.box_2d.join(', ')}]`,
      ]);
    } else if (activeTab === 'BITEMPORAL_CHANGE' && changeResult?.change_clusters && changeResult.change_clusters.length > 0) {
      tableTitle = 'BI-TEMPORAL CHANGE CLUSTERS & HYDROLOGICAL DELTA';
      tableHead = [['Cluster ID', 'Change Classification', 'Severity', 'Confidence', 'Area (ha)', 'Description']];
      tableBody = changeResult.change_clusters.map((cl) => [
        cl.id,
        cl.change_type,
        cl.severity,
        `${Math.round(cl.confidence * 100)}%`,
        `${cl.area_ha} ha`,
        cl.description,
      ]);
    } else if (activeTab === 'OPTICAL_SAR_FUSION' && fusionResult?.fused_detections && fusionResult.fused_detections.length > 0) {
      tableTitle = 'DUAL-SENSOR FUSED RADAR-OPTICAL DETECTIONS';
      tableHead = [['Detection ID', 'Feature Label', 'Confidence', 'SAR Backscatter', 'Area (ha)', 'Description']];
      tableBody = fusionResult.fused_detections.map((fd) => [
        fd.id,
        fd.label,
        `${Math.round(fd.confidence * 100)}%`,
        `${fd.sar_backscatter_db} dB`,
        fd.area_ha !== undefined ? `${fd.area_ha} ha` : 'N/A',
        fd.description,
      ]);
    }

    if (tableBody.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(tableTitle, margin, currentY);
      currentY += 8;

      autoTable(doc, {
        startY: currentY,
        head: tableHead,
        body: tableBody,
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 4,
          textColor: [51, 65, 85],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: margin, right: margin },
      });

      currentY = (doc as any).lastAutoTable.finalY + 12;
    }

    // 5. Quantitative Remote Sensing Telemetry Table
    const telemetryRows: string[][] = [];
    if (activeTab === 'SINGLE_VQA' && vqaResult?.spectral_indices) {
      Object.entries(vqaResult.spectral_indices).forEach(([k, v]) => {
        telemetryRows.push([k.toUpperCase(), typeof v === 'number' ? v.toFixed(4) : String(v)]);
      });
    } else if (activeTab === 'BITEMPORAL_CHANGE' && changeResult) {
      telemetryRows.push(['Overall Surface Alteration', `+${changeResult.overall_change_percentage}%`]);
      telemetryRows.push(['Total Impacted Surface Extent', `${changeResult.total_impacted_area_km2} km²`]);
      if (changeResult.sector_damage_breakdown) {
        Object.entries(changeResult.sector_damage_breakdown).forEach(([k, v]) => {
          telemetryRows.push([k.replace(/_/g, ' ').toUpperCase(), String(v)]);
        });
      }
    } else if (activeTab === 'OPTICAL_SAR_FUSION' && fusionResult) {
      telemetryRows.push(['Cloud Occlusion Level', fusionResult.cloud_penetration_summary.optical_cloud_occlusion]);
      telemetryRows.push(['SAR Penetration Surface Gain', fusionResult.cloud_penetration_summary.cloud_penetration_gain]);
      telemetryRows.push(['Mean Radar VV Backscatter', `${fusionResult.polarization_telemetry.vv_backscatter_mean_db} dB`]);
      telemetryRows.push(['Speckle Suppression Ratio', fusionResult.polarization_telemetry.speckle_suppression_ratio]);
      telemetryRows.push(['Lee Filter Window', fusionResult.polarization_telemetry.lee_filter_window]);
    }

    if (telemetryRows.length > 0) {
      if (currentY + 80 > pageHeight - 50) {
        doc.addPage();
        currentY = margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('QUANTITATIVE SENSOR TELEMETRY & OBSERVATION MATRIX', margin, currentY);
      currentY += 8;

      autoTable(doc, {
        startY: currentY,
        head: [['Telemetry Indicator', 'Measured Value']],
        body: telemetryRows,
        theme: 'grid',
        headStyles: {
          fillColor: [8, 145, 178], // Cyan 600
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 4,
          textColor: [30, 41, 59],
        },
        margin: { left: margin, right: margin },
      });

      currentY = (doc as any).lastAutoTable.finalY + 12;
    }

    // 6. Metric Derivation Table
    const derivations: MetricDerivation[] =
      activeTab === 'SINGLE_VQA'
        ? vqaResult?.metric_derivations || []
        : activeTab === 'BITEMPORAL_CHANGE'
        ? changeResult?.metric_derivations || []
        : fusionResult?.metric_derivations || [];

    if (derivations.length > 0) {
      if (currentY + 80 > pageHeight - 50) {
        doc.addPage();
        currentY = margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('EXPLICIT METRIC DERIVATION PROVENANCE', margin, currentY);
      currentY += 8;

      autoTable(doc, {
        startY: currentY,
        head: [['Metric', 'Source Sensor / Layer', 'Mathematical Computation', 'Value']],
        body: derivations.map((d) => [d.metric, d.source, d.computation, d.unit]),
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 4,
          textColor: [51, 65, 85],
        },
        margin: { left: margin, right: margin },
      });

      currentY = (doc as any).lastAutoTable.finalY + 12;
    }

    // 7. Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);

      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);

      doc.text('SATQUERY.AI • ISRO RS-VLM Multimodal Planetary Intelligence Briefing', margin, pageHeight - 14);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 14, { align: 'right' });
    }

    // Trigger download
    const filename = `SATQUERY_ISRO_VLM_${preset.id}_${Date.now()}.pdf`;
    doc.save(filename);
  },
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
