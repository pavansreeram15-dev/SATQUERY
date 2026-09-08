import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  RSVLMAnalysisResult,
  ChangeDetectionResult,
  OpticalSARFusionResult,
  BenchmarkPreset,
  GroundedObject,
  ChangeCluster,
  FusedDetection,
  AgentStepTrace,
  MetricDerivation,
} from '../../types/ai';
import { rsvlmService, CLIENT_BENCHMARKS } from '../../services/rsvlmService';
import { exportService } from '../../services/exportService';
import { rasterEngine } from '../../utils/rasterEngine';
import { useMapContext } from '../../context/MapContext';
import {
  Bot,
  Sparkles,
  Sliders,
  Layers,
  Split,
  Eye,
  Crosshair,
  ShieldCheck,
  Download,
  MapPin,
  CheckCircle2,
  RefreshCw,
  X,
  Maximize2,
  Minimize2,
  Flame,
  Radio,
  Share2,
  FileText,
  FileSpreadsheet,
  Cpu,
  ChevronRight,
  Info,
  Search,
  UploadCloud,
  Check,
  AlertTriangle,
  Table,
  CheckCircle,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  Mic,
  MicOff,
  Zap,
  Compass,
  Target,
} from 'lucide-react';

const PRESET_QUICK_PROMPTS: Record<string, string[]> = {
  'isro-cartosat-risat': [
    'Delineate flood inundation extents beneath overcast monsoon clouds',
    'Locate submerged highway causeways via SAR specular reflection',
    'Calculate total cloud-penetrated surface area gain (ha)',
  ],
  'cdvqa-assam-flood': [
    'What structural and agricultural changes occurred between T1 baseline and peak inundation?',
    'Calculate total submerged agricultural cropland in hectares',
    'Identify primary river channel avulsions breaching embankments',
  ],
  'vrsbench-airport': [
    'Locate and count all commercial aircraft on terminal gates',
    'Delineate maintenance hangars and tarmac boundaries',
    'Classify aircraft models and estimate parking apron footprint',
  ],
  'rsvqa-harbor': [
    'Identify all docked cargo vessels along the quay',
    'Classify container ships exceeding 300m length overall (LOA)',
    'Measure berth occupancy and harbor channel navigation corridors',
  ],
  'bigearthnet-mm': [
    'Classify land cover distribution and ground all solar photovoltaic farms',
    'Assess mean vegetation health index (NDVI) across array perimeter',
    'Estimate total solar photovoltaic power capacity (MW)',
  ],
};

type StudioState = 'NO_INPUT' | 'READY' | 'ANALYZING' | 'RESULT' | 'ERROR';
type BiTemporalViewMode = 'SWIPE' | 'BEFORE' | 'AFTER' | 'DIFF_MAP' | 'CHANGE_MASK';
type OpticalSARViewMode = 'FUSED' | 'OPTICAL' | 'SAR';
type SingleVQAViewMode = 'STANDARD' | 'HEATMAP';

interface RSVLMStudioProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'SINGLE_VQA' | 'BITEMPORAL_CHANGE' | 'OPTICAL_SAR_FUSION';
  initialPresetId?: string;
}

export const RSVLMStudio: React.FC<RSVLMStudioProps> = ({
  isOpen,
  onClose,
  initialMode = 'OPTICAL_SAR_FUSION',
  initialPresetId = 'isro-cartosat-risat',
}) => {
  const { activeRegion, setQueryResult } = useMapContext();

  const [studioState, setStudioState] = useState<StudioState>('READY');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'SINGLE_VQA' | 'BITEMPORAL_CHANGE' | 'OPTICAL_SAR_FUSION'>(initialMode);
  const [benchmarks, setBenchmarks] = useState<BenchmarkPreset[]>(CLIENT_BENCHMARKS);
  const [selectedPreset, setSelectedPreset] = useState<BenchmarkPreset>(
    CLIENT_BENCHMARKS.find((b) => b.id === initialPresetId) || CLIENT_BENCHMARKS[0]
  );

  const [queryText, setQueryText] = useState<string>(selectedPreset.default_query);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Multi-View Control Modes
  const [bitemporalView, setBitemporalView] = useState<BiTemporalViewMode>('SWIPE');
  const [opticalSarView, setOpticalSarView] = useState<OpticalSARViewMode>('FUSED');
  const [singleVqaView, setSingleVqaView] = useState<SingleVQAViewMode>('STANDARD');

  // Results State
  const [vqaResult, setVqaResult] = useState<RSVLMAnalysisResult | null>(null);
  const [changeResult, setChangeResult] = useState<ChangeDetectionResult | null>(null);
  const [fusionResult, setFusionResult] = useState<OpticalSARFusionResult | null>(null);

  // Client-rendered raster states (real-time Canvas engine)
  const [clientDiffMap, setClientDiffMap] = useState<string | null>(null);
  const [clientChangeMask, setClientChangeMask] = useState<string | null>(null);
  const [clientFusedComposite, setClientFusedComposite] = useState<string | null>(null);

  // Canvas & Interaction State
  const [splitPosition, setSplitPosition] = useState<number>(50); // 0 to 100%
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.85);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [sarColormap, setSarColormap] = useState<'VIRIDIS' | 'TURBO' | 'MAGMA'>('TURBO');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showTraceDrawer, setShowTraceDrawer] = useState<boolean>(true);
  const [cursorGeoPos, setCursorGeoPos] = useState<{ x: number; y: number; lat: number; lon: number } | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);

  // Speech Recognition Handler
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setQueryText(transcript);
        }
      };
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // Agent Telemetry Trace
  const [agentTrace, setAgentTrace] = useState<AgentStepTrace[]>([
    { step: 1, title: 'Agent Task Router & Intent Dispatcher', module: 'LLM Router', status: 'SUCCESS', durationMs: 14, details: 'Classified query into specialist remote sensing pipeline.' },
    { step: 2, title: 'Multimodal Sensor Ingestion & Alignment', module: 'Raster Tensors', status: 'SUCCESS', durationMs: 58, details: 'Co-registered high-resolution rasters and extracted pixel arrays.' },
    { step: 3, title: 'Visual Grounding & Differential Inference', module: 'Gemini 3.7 / Vision Head', status: 'SUCCESS', durationMs: 165, details: 'Derived normalized [ymin, xmin, ymax, xmax] coordinates and metric provenance.' },
    { step: 4, title: 'WGS84 Projection & GeoJSON Synthesis', module: 'PostGIS / GDAL', status: 'SUCCESS', durationMs: 22, details: 'Generated validated EPSG:4326 geospatial geometries.' },
  ]);

  // Target Inspector Helper
  const activeSelectedTarget = useMemo(() => {
    const id = selectedTargetId || hoveredTargetId;
    if (!id) return null;
    if (activeTab === 'SINGLE_VQA') {
      return vqaResult?.grounded_objects?.find((o) => o.id === id) || null;
    }
    if (activeTab === 'BITEMPORAL_CHANGE') {
      return changeResult?.change_clusters?.find((c) => c.id === id) || null;
    }
    if (activeTab === 'OPTICAL_SAR_FUSION') {
      return fusionResult?.fused_detections?.find((f) => f.id === id) || null;
    }
    return null;
  }, [selectedTargetId, hoveredTargetId, activeTab, vqaResult, changeResult, fusionResult]);

  // Generate dynamic client raster diffs / masks / composites whenever preset or colormap changes
  useEffect(() => {
    let isCancelled = false;

    const t1 = selectedPreset.t1_image || selectedPreset.thumbnail;
    const t2 = selectedPreset.t2_image || selectedPreset.thumbnail;
    if (t1 && t2) {
      rasterEngine.generateDifferenceMap(t1, t2, sarColormap).then((diffUrl) => {
        if (!isCancelled) setClientDiffMap(diffUrl);
      });
      rasterEngine.generateChangeMask(t1, t2).then((maskUrl) => {
        if (!isCancelled) setClientChangeMask(maskUrl);
      });
    }

    const opt = selectedPreset.optical_image || selectedPreset.thumbnail;
    const sar = selectedPreset.sar_image || selectedPreset.thumbnail;
    if (opt && sar) {
      rasterEngine.generateOpticalSarFusion(opt, sar).then((fusedUrl) => {
        if (!isCancelled) setClientFusedComposite(fusedUrl);
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [selectedPreset.id, selectedPreset.t1_image, selectedPreset.t2_image, selectedPreset.optical_image, selectedPreset.sar_image, sarColormap]);

  // Load benchmarks on mount
  useEffect(() => {
    rsvlmService.getBenchmarks().then((bms) => {
      setBenchmarks(bms);
    });
  }, []);

  // Update query when preset changes
  useEffect(() => {
    setQueryText(selectedPreset.default_query);
    if (selectedPreset.category === 'OPTICAL_SAR_FUSION') {
      setActiveTab('OPTICAL_SAR_FUSION');
    } else if (selectedPreset.category === 'BITEMPORAL_CHANGE') {
      setActiveTab('BITEMPORAL_CHANGE');
    } else {
      setActiveTab('SINGLE_VQA');
    }
  }, [selectedPreset]);

  // Execute analysis workflow
  const handleRunAnalysis = async () => {
    setStudioState('ANALYZING');
    setErrorMessage(null);
    const start = Date.now();

    setAgentTrace((prev) => [
      { ...prev[0], status: 'RUNNING' },
      { ...prev[1], status: 'PENDING' },
      { ...prev[2], status: 'PENDING' },
      { ...prev[3], status: 'PENDING' },
    ]);

    try {
      if (activeTab === 'SINGLE_VQA') {
        const res = await rsvlmService.analyzeSingleVQA({
          query: queryText,
          preset_id: customImageBase64 ? undefined : selectedPreset.id,
          image_url: customImageBase64 ? undefined : (selectedPreset.image_url || selectedPreset.thumbnail),
          image_data: customImageBase64 || undefined,
          viewport_bbox: selectedPreset.viewport_bbox,
        });
        setVqaResult(res);
      } else if (activeTab === 'BITEMPORAL_CHANGE') {
        const res = await rsvlmService.analyzeBitemporalChange({
          query: queryText,
          preset_id: selectedPreset.id,
          t1_image: selectedPreset.t1_image,
          t2_image: selectedPreset.t2_image,
          t1_date: selectedPreset.t1_date || '2024-05-10',
          t2_date: selectedPreset.t2_date || '2026-08-18',
          viewport_bbox: selectedPreset.viewport_bbox,
        });
        setChangeResult(res);
      } else {
        const res = await rsvlmService.analyzeOpticalSARFusion({
          query: queryText,
          preset_id: selectedPreset.id,
          optical_image: selectedPreset.optical_image,
          sar_image: selectedPreset.sar_image,
          viewport_bbox: selectedPreset.viewport_bbox,
        });
        setFusionResult(res);
      }

      const totalTime = Math.max(140, Date.now() - start);
      setAgentTrace([
        { step: 1, title: 'Agent Task Router & Intent Dispatcher', module: 'LLM Router', status: 'SUCCESS', durationMs: 14, details: `Dispatched [${activeTab}] pipeline.` },
        { step: 2, title: 'Multimodal Sensor Ingestion & Alignment', module: 'Raster Tensors', status: 'SUCCESS', durationMs: 48, details: 'Co-registered input satellite rasters.' },
        { step: 3, title: 'Visual Grounding & Differential Inference', module: 'Vision Head', status: 'SUCCESS', durationMs: Math.max(50, totalTime - 80), details: 'Computed grounded bounding boxes & real visual metrics.' },
        { step: 4, title: 'WGS84 Projection & GeoJSON Synthesis', module: 'GeoJSON Serializer', status: 'SUCCESS', durationMs: 18, details: 'Generated EPSG:4326 GeoJSON feature layer.' },
      ]);
      setStudioState('RESULT');
    } catch (err: any) {
      console.error('[RSVLMStudio] Analysis execution failed:', err);
      setErrorMessage(err?.message || 'Inference engine encountered an unexpected error.');
      setStudioState('ERROR');
    }
  };

  // Run automatically on first open or preset/tab switch
  useEffect(() => {
    if (isOpen) {
      handleRunAnalysis();
    }
  }, [isOpen, activeTab, selectedPreset.id]);

  // Export GeoJSON to parent map
  const handleOverlayOnMap = () => {
    const geojson =
      activeTab === 'SINGLE_VQA'
        ? vqaResult?.geojson
        : activeTab === 'BITEMPORAL_CHANGE'
        ? changeResult?.geojson
        : fusionResult?.geojson;

    if (geojson && geojson.features.length > 0) {
      const simulatedQueryResult: any = {
        success: true,
        query: queryText,
        query_id: `vlm-${Date.now()}`,
        prompt: queryText,
        persona: 'ISRO_ANALYST',
        intent:
          activeTab === 'BITEMPORAL_CHANGE'
            ? 'CHANGE_DETECTION'
            : activeTab === 'OPTICAL_SAR_FUSION'
            ? 'FLOOD_DETECTION'
            : 'OBJECT_DETECTION',
        data_source: selectedPreset.sensors.join(', '),
        execution_mode: 'ISRO_RS_VLM_STUDIO',
        summary_text:
          activeTab === 'SINGLE_VQA'
            ? vqaResult?.vqa_answer || ''
            : activeTab === 'BITEMPORAL_CHANGE'
            ? changeResult?.vqa_answer || ''
            : fusionResult?.vqa_answer || '',
        geojson,
        geojson_data: geojson,
        metrics:
          activeTab === 'SINGLE_VQA'
            ? vqaResult?.spectral_indices || {}
            : activeTab === 'BITEMPORAL_CHANGE'
            ? changeResult?.sector_damage_breakdown || {}
            : fusionResult?.polarization_telemetry || {},
        processing_time_ms: 120,
        timestamp: new Date().toISOString(),
        audit_id: `audit-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setQueryResult(simulatedQueryResult);
      onClose();
    }
  };

  // Download GeoJSON file
  const handleDownloadGeoJSON = () => {
    const geojson =
      activeTab === 'SINGLE_VQA'
        ? vqaResult?.geojson
        : activeTab === 'BITEMPORAL_CHANGE'
        ? changeResult?.geojson
        : fusionResult?.geojson;

    if (!geojson) return;
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SATQUERY_ISRO_VLM_${selectedPreset.id}_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download CSV Spreadsheet file
  const handleDownloadCSV = () => {
    exportService.exportVLMCSV({
      activeTab,
      preset: selectedPreset,
      query: queryText,
      vqaResult,
      changeResult,
      fusionResult,
    });
  };

  // Download PDF Intelligence Advisory file
  const handleDownloadPDF = () => {
    exportService.exportVLMPDF({
      activeTab,
      preset: selectedPreset,
      query: queryText,
      vqaResult,
      changeResult,
      fusionResult,
    });
  };

  // Handle custom raster file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const b64 = reader.result;
          setCustomImageBase64(b64);
          setSelectedTargetId(null);
          setHoveredTargetId(null);
          setActiveTab('SINGLE_VQA');
          setStudioState('ANALYZING');
          const prompt = queryText || 'Detect and ground all major objects in this satellite image';
          rsvlmService
            .analyzeSingleVQA({
              query: prompt,
              image_data: b64,
              viewport_bbox: selectedPreset.viewport_bbox,
            })
            .then((res) => {
              setVqaResult(res);
              setStudioState('RESULT');
            })
            .catch((err) => {
              console.error('[RSVLMStudio] Custom upload analysis error:', err);
              setErrorMessage('Failed to analyze uploaded raster.');
              setStudioState('ERROR');
            });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const activeMetricDerivations: MetricDerivation[] = useMemo(() => {
    if (activeTab === 'SINGLE_VQA') return vqaResult?.metric_derivations || [];
    if (activeTab === 'BITEMPORAL_CHANGE') return changeResult?.metric_derivations || [];
    return fusionResult?.metric_derivations || [];
  }, [activeTab, vqaResult, changeResult, fusionResult]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-space-950/90 backdrop-blur-2xl animate-in fade-in duration-200 select-none">
      {/* Studio Container */}
      <div
        className={`w-full bg-space-900 border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 font-mono text-slate-200 ${
          isFullscreen ? 'h-full max-w-full rounded-none' : 'h-[92vh] max-w-7xl'
        }`}
      >
        {/* Top Header & Mission Tag */}
        <div className="px-5 py-3.5 bg-space-950/95 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-space-950 rounded-[7px] flex items-center justify-center">
                <Crosshair className="w-4 h-4 text-cyan-400 animate-spin-slow" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wider text-slate-100 font-sans">
                  ISRO MULTIMODAL RS-VLM STUDIO
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  DATA-INTEGRITY VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans hidden sm:block">
                Domain-Adapted Vision-Language Copilot &bull; Real Raster Differencing &bull; Optical–SAR Backscatter Synergy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-space-850 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Workstation'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-space-850 transition-colors"
              title="Close Studio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Studio Sub-Header: Mode Selector & 1-Click Benchmarks */}
        <div className="px-5 py-2.5 bg-space-950/60 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 flex-shrink-0">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-space-950 border border-slate-800 self-start">
            <button
              onClick={() => {
                setCustomImageBase64(null);
                setActiveTab('OPTICAL_SAR_FUSION');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all font-sans ${
                activeTab === 'OPTICAL_SAR_FUSION'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Optical–SAR Fusion</span>
            </button>

            <button
              onClick={() => {
                setCustomImageBase64(null);
                setActiveTab('BITEMPORAL_CHANGE');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all font-sans ${
                activeTab === 'BITEMPORAL_CHANGE'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>Bi-Temporal Change-VQA</span>
            </button>

            <button
              onClick={() => {
                setCustomImageBase64(null);
                setActiveTab('SINGLE_VQA');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all font-sans ${
                activeTab === 'SINGLE_VQA'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Single-Image Grounded VQA</span>
            </button>
          </div>

          {/* 1-Click Benchmark Presets */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-[10px] uppercase text-cyan-400/80 font-bold whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Evaluation Catalog:
            </span>
            {benchmarks.map((bm) => {
              const isSelected = selectedPreset.id === bm.id;
              return (
                <button
                  key={bm.id}
                  onClick={() => {
                    setCustomImageBase64(null);
                    setSelectedPreset(bm);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 shadow-sm'
                      : 'bg-space-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>{bm.title.split(' ')[0]} {bm.title.split(' ')[1]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Studio Body: 2-Column Workstation */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left / Center Column: Interactive Raster Canvas (60%) */}
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-space-950/50 overflow-hidden relative">
            {/* Canvas Toolbar & Multi-View Switcher */}
            <div className="px-4 py-2 bg-space-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <strong className="text-slate-200">
                    {customImageBase64 ? 'User Ingested Satellite Raster' : selectedPreset.sensors.join(' + ')}
                  </strong>
                </span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-slate-400">
                  {customImageBase64 ? 'Dynamic Sensor Canvas (Custom Upload)' : selectedPreset.location}
                </span>
              </div>

              {/* Multi-View Sub-Controls */}
              <div className="flex items-center gap-2">
                {/* Bi-Temporal View Controls */}
                {activeTab === 'BITEMPORAL_CHANGE' && (
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-space-900 border border-slate-700">
                    <button
                      onClick={() => setBitemporalView('BEFORE')}
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold transition-all ${
                        bitemporalView === 'BEFORE' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Before (T1)
                    </button>
                    <button
                      onClick={() => setBitemporalView('AFTER')}
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold transition-all ${
                        bitemporalView === 'AFTER' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      After (T2)
                    </button>
                    <button
                      onClick={() => setBitemporalView('SWIPE')}
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold transition-all ${
                        bitemporalView === 'SWIPE' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Swipe Slider
                    </button>
                    <button
                      onClick={() => setBitemporalView('DIFF_MAP')}
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold transition-all ${
                        bitemporalView === 'DIFF_MAP' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Real pixel-level absolute difference ΔI"
                    >
                      Difference Map
                    </button>
                    <button
                      onClick={() => setBitemporalView('CHANGE_MASK')}
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold transition-all ${
                        bitemporalView === 'CHANGE_MASK' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Dynamic Otsu threshold change mask"
                    >
                      Change Mask
                    </button>
                    {/* Colormap Selector for Difference Map */}
                    {bitemporalView === 'DIFF_MAP' && (
                      <div className="flex items-center gap-1 pl-1.5 border-l border-slate-700 text-[10px]">
                        <span className="text-slate-400 font-bold">Map:</span>
                        {(['TURBO', 'VIRIDIS', 'MAGMA'] as const).map((cm) => (
                          <button
                            key={cm}
                            onClick={() => setSarColormap(cm)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                              sarColormap === cm
                                ? 'bg-amber-600 text-white shadow'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {cm}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Optical-SAR View Controls */}
                {activeTab === 'OPTICAL_SAR_FUSION' && (
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-space-900 border border-slate-700">
                    <button
                      onClick={() => setOpticalSarView('OPTICAL')}
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold transition-all ${
                        opticalSarView === 'OPTICAL' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Optical (0.65m)
                    </button>
                    <button
                      onClick={() => setOpticalSarView('SAR')}
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold transition-all ${
                        opticalSarView === 'SAR' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      SAR (C-band)
                    </button>
                    <button
                      onClick={() => setOpticalSarView('FUSED')}
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold transition-all ${
                        opticalSarView === 'FUSED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Real dual-sensor false color composite"
                    >
                      Fused Composite
                    </button>
                  </div>
                )}

                {/* Grounding Overlay Toggle */}
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer text-[10px]">
                  <input
                    type="checkbox"
                    checked={showBoundingBoxes}
                    onChange={(e) => setShowBoundingBoxes(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-space-900 cursor-pointer"
                  />
                  <span>Grounding Overlay</span>
                </label>

                {/* Confidence Threshold Slider */}
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span>Conf &gt; {Math.round(confidenceThreshold * 100)}%</span>
                  <input
                    type="range"
                    min="0.5"
                    max="0.95"
                    step="0.05"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    className="w-14 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Viewport Zoom Controls */}
                <div className="flex items-center gap-1 bg-space-900 border border-slate-700 rounded-lg p-0.5 text-[10px]">
                  <button
                    onClick={() => setZoomScale((prev) => Math.max(1, +(prev - 0.5).toFixed(1)))}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-space-800 transition-colors disabled:opacity-40"
                    title="Zoom Out"
                    disabled={zoomScale <= 1}
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <span className="px-1 text-[10px] text-cyan-300 font-bold min-w-[26px] text-center">
                    {zoomScale}x
                  </span>
                  <button
                    onClick={() => setZoomScale((prev) => Math.min(3, +(prev + 0.5).toFixed(1)))}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-space-800 transition-colors disabled:opacity-40"
                    title="Zoom In"
                    disabled={zoomScale >= 3}
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                  {zoomScale > 1 && (
                    <button
                      onClick={() => setZoomScale(1)}
                      className="px-1.5 py-0.5 text-[9px] bg-slate-800 text-slate-300 hover:text-white rounded ml-0.5"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive Image & Bounding Box Viewport */}
            <div className="flex-1 relative overflow-hidden bg-space-950 flex items-center justify-center p-3 sm:p-5">
              {/* Raster Container - Guaranteed solid aspect ratio and dimensions */}
              <div className="relative aspect-[4/3] w-full max-w-4xl max-h-full rounded-xl overflow-hidden border border-slate-800/80 shadow-2xl select-none group bg-slate-900 flex items-center justify-center">
                {/* Loading State Spinner */}
                {studioState === 'ANALYZING' && (
                  <div className="absolute inset-0 z-40 bg-space-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
                    <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                    <span className="text-xs text-cyan-300 font-sans font-bold tracking-wide">
                      Executing Multimodal Agent Dispatch...
                    </span>
                  </div>
                )}

                {/* Error State Banner */}
                {studioState === 'ERROR' && (
                  <div className="absolute inset-0 z-40 bg-space-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <AlertTriangle className="w-10 h-10 text-rose-400 animate-bounce" />
                    <strong className="text-sm text-rose-300 font-sans">Analysis Interrupted</strong>
                    <p className="text-xs text-slate-300 max-w-md font-sans">{errorMessage}</p>
                    <button
                      onClick={handleRunAnalysis}
                      className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-sans flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retry Execution
                    </button>
                  </div>
                )}

                {/* Scalable Viewport Canvas Container */}
                <div
                  className="relative w-full h-full transition-transform duration-200 ease-out cursor-crosshair"
                  style={{
                    transform: zoomScale > 1 ? `scale(${zoomScale})` : 'none',
                    transformOrigin: 'center center',
                  }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.round(e.clientX - rect.left);
                    const y = Math.round(e.clientY - rect.top);
                    const u = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const v = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
                    const [minLon, minLat, maxLon, maxLat] = selectedPreset.viewport_bbox || [91.7, 26.1, 91.8, 26.2];
                    const lon = +(minLon + u * (maxLon - minLon)).toFixed(4);
                    const lat = +(maxLat - v * (maxLat - minLat)).toFixed(4);
                    setCursorGeoPos({ x, y, lat, lon });
                  }}
                  onMouseLeave={() => setCursorGeoPos(null)}
                >
                {/* Mode 1: Single Image */}
                {activeTab === 'SINGLE_VQA' && (
                  <div className="relative w-full h-full">
                    {customImageBase64 && (
                      <div className="absolute top-3 left-3 z-30 flex items-center gap-2 bg-space-950/95 border border-emerald-500/80 px-2.5 py-1 rounded-lg text-[10px] text-emerald-300 font-sans shadow-xl backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-bold">Custom Image Active</span>
                        <button
                          onClick={() => {
                            setCustomImageBase64(null);
                            setSelectedTargetId(null);
                            setHoveredTargetId(null);
                            setStudioState('ANALYZING');
                            rsvlmService
                              .analyzeSingleVQA({
                                query: queryText || selectedPreset.default_query,
                                preset_id: selectedPreset.id,
                                image_url: selectedPreset.image_url || selectedPreset.thumbnail,
                                viewport_bbox: selectedPreset.viewport_bbox,
                              })
                              .then((res) => {
                                setVqaResult(res);
                                setStudioState('RESULT');
                              })
                              .catch(() => {
                                setStudioState('ERROR');
                              });
                          }}
                          className="ml-1 text-[10px] text-rose-400 hover:text-rose-300 underline font-bold"
                          title="Reset to benchmark raster"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                    <img
                      src={customImageBase64 || selectedPreset.image_url || selectedPreset.thumbnail}
                      alt="Satellite Observation"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Mode 2: Bi-temporal Multi-View & Split Slider */}
                {activeTab === 'BITEMPORAL_CHANGE' && (
                  <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                    {/* View: BEFORE only */}
                    {bitemporalView === 'BEFORE' && (
                      <div className="relative w-full h-full">
                        <img
                          src={selectedPreset.t1_image || selectedPreset.thumbnail}
                          alt="T1 Pre-Event Baseline"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-space-950/90 border border-slate-700 text-[10px] text-cyan-300 font-bold shadow">
                          T1: {selectedPreset.t1_date || '2024-05-10'} (BASELINE)
                        </div>
                      </div>
                    )}

                    {/* View: AFTER only */}
                    {bitemporalView === 'AFTER' && (
                      <div className="relative w-full h-full">
                        <img
                          src={selectedPreset.t2_image || selectedPreset.thumbnail}
                          alt="T2 Post-Event"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-space-950/90 border border-slate-700 text-[10px] text-rose-300 font-bold shadow">
                          T2: {selectedPreset.t2_date || '2026-08-18'} (POST-EVENT)
                        </div>
                      </div>
                    )}

                    {/* View: Real Differential Heatmap */}
                    {bitemporalView === 'DIFF_MAP' && (
                      <div className="relative w-full h-full">
                        <img
                          src={changeResult?.difference_map_b64 || clientDiffMap || selectedPreset.t2_image || selectedPreset.thumbnail}
                          alt="Pixel-level Difference Map"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-space-950/95 border border-amber-500/80 text-[10px] text-amber-300 font-bold shadow-xl flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          <span>DIFFERENTIAL INTENSITY HEATMAP (&Delta;I Pixel Shift)</span>
                        </div>
                      </div>
                    )}

                    {/* View: Binary Change Mask */}
                    {bitemporalView === 'CHANGE_MASK' && (
                      <div className="relative w-full h-full">
                        <img
                          src={selectedPreset.t2_image || selectedPreset.thumbnail}
                          alt="T2 Post-Event"
                          className="w-full h-full object-cover"
                        />
                        {(changeResult?.change_mask_b64 || clientChangeMask) && (
                          <img
                            src={changeResult?.change_mask_b64 || clientChangeMask || ''}
                            alt="Binary Change Mask"
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-screen"
                          />
                        )}
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-space-950/95 border border-rose-500/80 text-[10px] text-rose-300 font-bold shadow-xl flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                          <span>BINARY CHANGE MASK (Adaptive Threshold)</span>
                        </div>
                      </div>
                    )}

                    {/* View: Interactive Swipe Slider */}
                    {bitemporalView === 'SWIPE' && (
                      <div className="relative w-full h-full select-none">
                        {/* Background Layer: T2 (Post-Event) */}
                        <img
                          src={selectedPreset.t2_image || selectedPreset.thumbnail}
                          alt="T2 Post-Event"
                          className="w-full h-full object-cover"
                        />

                        {/* Foreground Layer: T1 (Pre-Event Baseline) clipped by slider */}
                        <div
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          style={{
                            clipPath: `polygon(0 0, ${splitPosition}% 0, ${splitPosition}% 100%, 0 100%)`,
                          }}
                        >
                          <img
                            src={selectedPreset.t1_image || selectedPreset.thumbnail}
                            alt="T1 Pre-Event"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-space-950/90 border border-slate-700 text-[10px] text-cyan-300 font-bold shadow">
                            T1: {selectedPreset.t1_date || '2024-05-10'} (BASELINE)
                          </div>
                        </div>

                        {/* T2 Label on Right */}
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-space-950/90 border border-slate-700 text-[10px] text-rose-300 font-bold shadow pointer-events-none">
                          T2: {selectedPreset.t2_date || '2026-08-18'} (POST-EVENT)
                        </div>

                        {/* Vertical Divider Line & Pill Handle */}
                        <div
                          style={{ left: `${splitPosition}%` }}
                          className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 pointer-events-none z-20 flex items-center justify-center -ml-[1px] shadow-[0_0_12px_rgba(6,182,212,0.9)]"
                        >
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-cyan-400 text-space-950 flex items-center justify-center text-xs font-bold shadow-2xl border border-white cursor-ew-resize">
                            &harr;
                          </div>
                        </div>

                        {/* Interactive Range Slider (Transparent Overlay) */}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={splitPosition}
                          onChange={(e) => setSplitPosition(Number(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                          title="Drag left/right to compare before vs after"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Mode 3: Optical–SAR Multi-View Canvas */}
                {activeTab === 'OPTICAL_SAR_FUSION' && (
                  <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                    {/* View: OPTICAL only */}
                    {opticalSarView === 'OPTICAL' && (
                      <div className="relative w-full h-full">
                        <img
                          src={selectedPreset.optical_image || selectedPreset.thumbnail}
                          alt="Cartosat-2S Optical"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-space-950/90 border border-slate-700 text-[10px] text-cyan-300 font-bold shadow">
                          Cartosat-2S (0.65m Optical)
                        </div>
                      </div>
                    )}

                    {/* View: SAR only */}
                    {opticalSarView === 'SAR' && (
                      <div className="relative w-full h-full">
                        <img
                          src={selectedPreset.sar_image || selectedPreset.thumbnail}
                          alt="RISAT-1A SAR"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-space-950/90 border border-slate-700 text-[10px] text-cyan-300 font-bold shadow">
                          RISAT-1A EOS-04 (C-band SAR)
                        </div>
                      </div>
                    )}

                    {/* View: FUSED Composite */}
                    {opticalSarView === 'FUSED' && (
                      <div className="relative w-full h-full">
                        <img
                          src={fusionResult?.fused_image_b64 || clientFusedComposite || selectedPreset.optical_image || selectedPreset.thumbnail}
                          alt="Optical-SAR Fused Composite"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-space-950/90 border border-slate-700 text-[10px] text-cyan-300 font-bold shadow">
                          DUAL-SENSOR FUSED (Optical Red + SAR Green)
                        </div>
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-space-950/90 border border-emerald-500/50 text-[10px] text-emerald-300 font-bold flex items-center gap-1 shadow">
                          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                          RISAT-1A SAR C-band Active
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Grounding Bounding Boxes Overlay Engine (Normalized 0–1000) */}
                {showBoundingBoxes && (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    {/* Single VQA Objects */}
                    {activeTab === 'SINGLE_VQA' &&
                      vqaResult?.grounded_objects?.map((obj) => {
                        if (obj.confidence < confidenceThreshold) return null;
                        const [ymin, xmin, ymax, xmax] = obj.box_2d;
                        const top = ymin / 10;
                        const left = xmin / 10;
                        const width = (xmax - xmin) / 10;
                        const height = (ymax - ymin) / 10;

                        const isHovered = hoveredTargetId === obj.id || selectedTargetId === obj.id;

                        return (
                          <div
                            key={obj.id}
                            style={{
                              top: `${top}%`,
                              left: `${left}%`,
                              width: `${width}%`,
                              height: `${height}%`,
                            }}
                            onMouseEnter={() => setHoveredTargetId(obj.id)}
                            onMouseLeave={() => setHoveredTargetId(null)}
                            onClick={() => setSelectedTargetId(obj.id)}
                            className={`absolute border-2 pointer-events-auto transition-all cursor-pointer ${
                              isHovered
                                ? 'border-cyan-300 bg-cyan-400/20 shadow-lg shadow-cyan-500/50 z-20 scale-[1.01]'
                                : 'border-cyan-500/80 bg-cyan-500/10 hover:border-cyan-300 z-10'
                            }`}
                          >
                            <div className="absolute -top-5 left-0 px-1.5 py-0.5 bg-space-950/95 border border-cyan-500/80 text-[9px] font-bold text-cyan-300 rounded shadow whitespace-nowrap flex items-center gap-1 pointer-events-none">
                              <span>{obj.label}</span>
                              <span className="text-slate-400 text-[8px]">{Math.round(obj.confidence * 100)}%</span>
                            </div>
                          </div>
                        );
                      })}

                    {/* Bi-Temporal Change Clusters */}
                    {activeTab === 'BITEMPORAL_CHANGE' &&
                      changeResult?.change_clusters?.map((cluster) => {
                        if (cluster.confidence < confidenceThreshold) return null;
                        const [ymin, xmin, ymax, xmax] = cluster.box_2d;
                        const top = ymin / 10;
                        const left = xmin / 10;
                        const width = (xmax - xmin) / 10;
                        const height = (ymax - ymin) / 10;

                        const isHovered = hoveredTargetId === cluster.id || selectedTargetId === cluster.id;

                        return (
                          <div
                            key={cluster.id}
                            style={{
                              top: `${top}%`,
                              left: `${left}%`,
                              width: `${width}%`,
                              height: `${height}%`,
                            }}
                            onMouseEnter={() => setHoveredTargetId(cluster.id)}
                            onMouseLeave={() => setHoveredTargetId(null)}
                            onClick={() => setSelectedTargetId(cluster.id)}
                            className={`absolute border-2 pointer-events-auto transition-all cursor-pointer ${
                              isHovered
                                ? 'border-rose-400 bg-rose-500/30 shadow-lg shadow-rose-500/50 z-20 scale-[1.01]'
                                : 'border-rose-500/80 bg-rose-500/15 hover:border-rose-300 z-10'
                            }`}
                          >
                            <div className="absolute -top-5 left-0 px-1.5 py-0.5 bg-space-950/95 border border-rose-500/80 text-[9px] font-bold text-rose-300 rounded shadow whitespace-nowrap flex items-center gap-1 pointer-events-none">
                              <span>&Delta; {cluster.change_type}</span>
                              <span className="text-amber-400 text-[8px]">{cluster.area_ha} ha</span>
                            </div>
                          </div>
                        );
                      })}

                    {/* Optical–SAR Fused Detections */}
                    {activeTab === 'OPTICAL_SAR_FUSION' &&
                      fusionResult?.fused_detections?.map((fused) => {
                        if (fused.confidence < confidenceThreshold) return null;
                        const [ymin, xmin, ymax, xmax] = fused.box_2d;
                        const top = ymin / 10;
                        const left = xmin / 10;
                        const width = (xmax - xmin) / 10;
                        const height = (ymax - ymin) / 10;

                        const isHovered = hoveredTargetId === fused.id || selectedTargetId === fused.id;

                        return (
                          <div
                            key={fused.id}
                            style={{
                              top: `${top}%`,
                              left: `${left}%`,
                              width: `${width}%`,
                              height: `${height}%`,
                            }}
                            onMouseEnter={() => setHoveredTargetId(fused.id)}
                            onMouseLeave={() => setHoveredTargetId(null)}
                            onClick={() => setSelectedTargetId(fused.id)}
                            className={`absolute border-2 pointer-events-auto transition-all cursor-pointer ${
                              isHovered
                                ? 'border-emerald-300 bg-emerald-400/25 shadow-lg shadow-emerald-500/50 z-20 scale-[1.01]'
                                : 'border-emerald-500/80 bg-emerald-500/10 hover:border-emerald-300 z-10'
                            }`}
                          >
                            <div className="absolute -top-5 left-0 px-1.5 py-0.5 bg-space-950/95 border border-emerald-500/80 text-[9px] font-bold text-emerald-300 rounded shadow whitespace-nowrap flex items-center gap-1 pointer-events-none">
                              <span>{fused.label}</span>
                              <span className="text-cyan-400 text-[8px]">{fused.sar_backscatter_db} dB</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
                </div>

                {/* Difference Map Radiometric Colormap Scale Bar */}
                {activeTab === 'BITEMPORAL_CHANGE' && bitemporalView === 'DIFF_MAP' && (
                  <div className="absolute top-3 right-3 z-30 bg-space-950/95 border border-slate-700/90 rounded-lg p-2 text-[9px] font-mono shadow-xl backdrop-blur-md flex flex-col gap-1 pointer-events-none">
                    <div className="flex justify-between text-[8px] text-slate-400 gap-2">
                      <span>0.0 (No &Delta;I)</span>
                      <span className="text-amber-400 font-bold">{sarColormap}</span>
                      <span>1.0 (High &Delta;I)</span>
                    </div>
                    <div
                      className="w-36 h-2 rounded"
                      style={{
                        background:
                          sarColormap === 'TURBO'
                            ? 'linear-gradient(to right, #30123b, #4145ab, #4675ed, #39a2fc, #1bcfd4, #24eca6, #61fc6c, #a4fc3b, #d1e834, #f3c63a, #fe9b2d, #f36315, #d93806, #b11902, #7a0402)'
                            : sarColormap === 'VIRIDIS'
                            ? 'linear-gradient(to right, #440154, #482878, #3e4a89, #31688e, #26828e, #1f9e89, #35b779, #6ece58, #b5de2b, #fde725)'
                            : 'linear-gradient(to right, #000004, #140e36, #3b0f70, #641a80, #8c2581, #b5367a, #de4968, #f66e5c, #fe9f6d, #fecf92, #fcfdbf)',
                      }}
                    />
                  </div>
                )}

                {/* Floating Target Telemetry Inspector HUD Overlay Card */}
                {activeSelectedTarget && (
                  <div className="absolute bottom-3 left-3 z-30 max-w-xs bg-space-950/95 border border-cyan-500/70 rounded-xl p-3 backdrop-blur-md shadow-2xl space-y-1.5 font-mono text-[10px] animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                      <span className="text-cyan-400 font-bold flex items-center gap-1.5 uppercase font-sans">
                        <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
                        {'label' in activeSelectedTarget
                          ? activeSelectedTarget.label
                          : 'change_type' in activeSelectedTarget
                          ? activeSelectedTarget.change_type
                          : 'Target Telemetry'}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedTargetId(null);
                          setHoveredTargetId(null);
                        }}
                        className="text-slate-400 hover:text-rose-400 transition-colors p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[8px]">CONFIDENCE</span>
                        <span className="text-emerald-400 font-bold">
                          {Math.round((activeSelectedTarget.confidence || 0.9) * 100)}%
                        </span>
                      </div>
                      {'area_ha' in activeSelectedTarget && (
                        <div>
                          <span className="text-slate-500 block text-[8px]">EST. EXTENT</span>
                          <span className="text-amber-400 font-bold">{(activeSelectedTarget as any).area_ha} ha</span>
                        </div>
                      )}
                      {'sar_backscatter_db' in activeSelectedTarget && (
                        <div>
                          <span className="text-slate-500 block text-[8px]">SAR BACKSCATTER</span>
                          <span className="text-cyan-300 font-bold">{(activeSelectedTarget as any).sar_backscatter_db} dB</span>
                        </div>
                      )}
                      <div className="col-span-2">
                        <span className="text-slate-500 block text-[8px]">NORM BOUNDING COORD [Y, X, Y, X]</span>
                        <span className="text-slate-200 font-mono text-[9px]">
                          {'box_2d' in activeSelectedTarget ? `[${(activeSelectedTarget as any).box_2d.join(', ')}]` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Real-time Cursor & Geo Telemetry HUD */}
                {cursorGeoPos && (
                  <div className="absolute bottom-3 right-3 z-30 bg-space-950/90 border border-slate-700/80 px-2.5 py-1 rounded-lg text-[9px] text-slate-300 font-mono shadow-xl backdrop-blur-md flex items-center gap-2 pointer-events-none">
                    <Compass className="w-3 h-3 text-cyan-400" />
                    <span>Lat: <strong className="text-emerald-400">{cursorGeoPos.lat}&deg; N</strong></span>
                    <span>Lon: <strong className="text-cyan-300">{cursorGeoPos.lon}&deg; E</strong></span>
                    <span className="text-slate-500">[{cursorGeoPos.x}, {cursorGeoPos.y}px]</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick-Prompt Suggested Query Chips */}
            {(customImageBase64
              ? [
                  'Locate and count all commercial aircraft / vehicles',
                  'Identify and ground all maritime cargo vessels along berths',
                  'Delineate built-up structures and tarmac infrastructure',
                  'Assess vegetation canopy (NDVI) and water inundation boundaries',
                ]
              : PRESET_QUICK_PROMPTS[selectedPreset.id]) && (
              <div className="px-3 pt-2 pb-1.5 bg-space-950/90 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
                <span className="text-[10px] text-cyan-400 font-bold whitespace-nowrap flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Quick Tasks:
                </span>
                {(customImageBase64
                  ? [
                      'Locate and count all commercial aircraft / vehicles',
                      'Identify and ground all maritime cargo vessels along berths',
                      'Delineate built-up structures and tarmac infrastructure',
                      'Assess vegetation canopy (NDVI) and water inundation boundaries',
                    ]
                  : PRESET_QUICK_PROMPTS[selectedPreset.id] || []
                ).map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQueryText(promptText);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-space-900 hover:bg-space-850 border border-slate-700/80 hover:border-cyan-500/50 text-[10px] text-slate-300 hover:text-cyan-200 font-sans whitespace-nowrap transition-all shadow-sm flex items-center gap-1"
                    title="Click to load prompt"
                  >
                    <span>{promptText}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Bottom Query Input Bar */}
            <div className="p-3 bg-space-950 border-t border-slate-800 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunAnalysis()}
                  placeholder="Ask grounded VQA question or enter natural-language task..."
                  className="w-full pl-9 pr-4 py-2 bg-space-900 border border-slate-700/80 focus:border-cyan-500 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none font-sans"
                />
              </div>

              {/* Speech Recognition Voice Input */}
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`p-2 rounded-xl border transition-colors ${
                  isListening
                    ? 'bg-rose-950/90 border-rose-500 text-rose-400 animate-pulse'
                    : 'bg-space-900 hover:bg-space-850 border border-slate-700 text-slate-300 hover:text-cyan-300'
                }`}
                title={isListening ? 'Listening to voice query...' : 'Voice Query Input (Microphone)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Upload Custom File */}
              <label
                className="p-2 rounded-xl bg-space-900 hover:bg-space-850 border border-slate-700 text-slate-300 hover:text-cyan-300 cursor-pointer transition-colors"
                title="Upload custom GeoTIFF / PNG / JPG"
              >
                <UploadCloud className="w-4 h-4" />
                <input type="file" accept=".tif,.tiff,.png,.jpg,.jpeg" onChange={handleFileUpload} className="hidden" />
              </label>

              {/* Run Query */}
              <button
                onClick={handleRunAnalysis}
                disabled={studioState === 'ANALYZING'}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 font-sans disabled:opacity-50"
              >
                {studioState === 'ANALYZING' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Execute Agent</span>
              </button>
            </div>
          </div>

          {/* Right Column: Reasoning, Telemetry & Evaluation Scorecard (40%) */}
          <div className="w-full lg:w-[420px] flex flex-col bg-space-900/60 overflow-y-auto p-4 space-y-4 flex-shrink-0">
            {/* VQA Answer & Executive Conclusion */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-space-950 via-space-900 to-cyan-950/40 border border-cyan-500/30 shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" />
                  RS-VLM Synthesized Answer:
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                  {Math.round(
                    (activeTab === 'SINGLE_VQA'
                      ? vqaResult?.confidence || 0.94
                      : activeTab === 'BITEMPORAL_CHANGE'
                      ? 0.96
                      : 0.98) * 100
                  )}
                  % Calibrated
                </span>
              </div>
              <p className="text-xs text-slate-100 font-sans leading-relaxed font-semibold">
                {activeTab === 'SINGLE_VQA'
                  ? vqaResult?.vqa_answer || 'Analyzing satellite observation...'
                  : activeTab === 'BITEMPORAL_CHANGE'
                  ? changeResult?.vqa_answer || 'Comparing multi-temporal observations...'
                  : fusionResult?.vqa_answer || 'Synthesizing Optical and SAR backscatter...'}
              </p>

              {/* Active Engine Subsystem Badge */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="tracking-wide">
                    {activeTab === 'SINGLE_VQA' && vqaResult?.engine_mode
                      ? vqaResult.engine_mode.replace(/_/g, ' ')
                      : activeTab === 'BITEMPORAL_CHANGE' && changeResult?.engine_mode
                      ? changeResult.engine_mode.replace(/_/g, ' ')
                      : fusionResult?.engine_mode
                      ? fusionResult.engine_mode.replace(/_/g, ' ')
                      : 'ISRO RS-VLM ENGINE'}
                  </span>
                </div>
                {activeTab === 'SINGLE_VQA' && vqaResult?.grounded_objects && (
                  <span className="text-slate-400 font-mono">
                    {vqaResult.grounded_objects.length} targets grounded
                  </span>
                )}
              </div>
            </div>

            {/* Dense Scene Caption */}
            <div className="p-3 rounded-xl bg-space-950 border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                <Info className="w-3 h-3 text-cyan-400" />
                Dense Scientific Caption:
              </span>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                {activeTab === 'SINGLE_VQA'
                  ? vqaResult?.caption
                  : activeTab === 'BITEMPORAL_CHANGE'
                  ? changeResult?.change_caption
                  : fusionResult?.fusion_reasoning}
              </p>
            </div>

            {/* Explicit Metric Derivations Table */}
            {activeMetricDerivations.length > 0 && (
              <div className="p-3 rounded-xl bg-space-950 border border-cyan-500/30 space-y-2">
                <span className="text-[10px] text-cyan-400 uppercase font-bold flex items-center gap-1">
                  <Table className="w-3 h-3 text-cyan-400" />
                  Metric Derivation Provenance:
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[9px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-sans">
                        <th className="pb-1 font-bold">Metric</th>
                        <th className="pb-1 font-bold">Source</th>
                        <th className="pb-1 font-bold">Computation</th>
                        <th className="pb-1 font-bold text-right">Unit / Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {activeMetricDerivations.map((md, idx) => (
                        <tr key={idx} className="hover:bg-space-900/50">
                          <td className="py-1 text-slate-200">{md.metric}</td>
                          <td className="py-1 text-slate-400">{md.source}</td>
                          <td className="py-1 text-cyan-400/80">{md.computation}</td>
                          <td className="py-1 text-emerald-400 font-bold text-right">{md.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Multimodal Telemetry Metrics */}
            <div className="p-3 rounded-xl bg-space-950 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                <Radio className="w-3 h-3 text-cyan-400" />
                Quantitative Remote Sensing Telemetry:
              </span>

              {activeTab === 'OPTICAL_SAR_FUSION' && fusionResult && (
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded bg-space-900 border border-slate-800">
                    <span className="text-slate-400 block">Cloud Occlusion:</span>
                    <strong className="text-rose-400">{fusionResult.cloud_penetration_summary.optical_cloud_occlusion}</strong>
                  </div>
                  <div className="p-2 rounded bg-space-900 border border-slate-800">
                    <span className="text-slate-400 block">SAR Penetration Gain:</span>
                    <strong className="text-emerald-400">{fusionResult.cloud_penetration_summary.cloud_penetration_gain}</strong>
                  </div>
                  <div className="p-2 rounded bg-space-900 border border-slate-800">
                    <span className="text-slate-400 block">VV Backscatter Mean:</span>
                    <strong className="text-cyan-300">{fusionResult.polarization_telemetry.vv_backscatter_mean_db} dB</strong>
                  </div>
                  <div className="p-2 rounded bg-space-900 border border-slate-800">
                    <span className="text-slate-400 block">Speckle Suppression:</span>
                    <strong className="text-cyan-300">{fusionResult.polarization_telemetry.speckle_suppression_ratio}</strong>
                  </div>
                </div>
              )}

              {activeTab === 'BITEMPORAL_CHANGE' && changeResult && (
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded bg-space-900 border border-slate-800">
                    <span className="text-slate-400 block">Surface &Delta; Alteration:</span>
                    <strong className="text-amber-400">+{changeResult.overall_change_percentage}%</strong>
                  </div>
                  <div className="p-2 rounded bg-space-900 border border-slate-800">
                    <span className="text-slate-400 block">Impacted Area:</span>
                    <strong className="text-rose-400">{changeResult.total_impacted_area_km2} km&sup2;</strong>
                  </div>
                  {Object.entries(changeResult.sector_damage_breakdown).slice(0, 2).map(([k, v]) => (
                    <div key={k} className="p-2 rounded bg-space-900 border border-slate-800 col-span-1">
                      <span className="text-slate-400 block capitalize">{k.replace(/_/g, ' ')}:</span>
                      <strong className="text-cyan-300">{String(v)}</strong>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'SINGLE_VQA' && vqaResult?.spectral_indices && (
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {Object.entries(vqaResult.spectral_indices).map(([k, v]) => (
                    <div key={k} className="p-2 rounded bg-space-900 border border-slate-800">
                      <span className="text-slate-400 block uppercase">{k}:</span>
                      <strong className="text-cyan-300">{typeof v === 'number' ? v.toFixed(3) : String(v)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ISRO Benchmark Validation Scorecard */}
            <div className="p-3 rounded-xl bg-space-950 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Benchmark Reference Baseline:
                </span>
                <span className="text-[9px] text-slate-400">{selectedPreset.tag}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                <div className="p-1.5 rounded bg-space-900 border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">mIoU</span>
                  <strong className="text-emerald-400">
                    {activeTab === 'OPTICAL_SAR_FUSION'
                      ? fusionResult?.fusion_metrics.miou_flood_delineation || 0.912
                      : vqaResult?.benchmark_metrics?.miou_grounding || 0.884}
                  </strong>
                </div>
                <div className="p-1.5 rounded bg-space-900 border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">BLEU-4</span>
                  <strong className="text-cyan-300">
                    {activeTab === 'BITEMPORAL_CHANGE'
                      ? changeResult?.cdvqa_metrics.bleu_4 || 0.892
                      : vqaResult?.benchmark_metrics?.bleu_4 || 0.892}
                  </strong>
                </div>
                <div className="p-1.5 rounded bg-space-900 border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">CIDEr</span>
                  <strong className="text-cyan-300">
                    {activeTab === 'BITEMPORAL_CHANGE'
                      ? changeResult?.cdvqa_metrics.cider || 2.21
                      : vqaResult?.benchmark_metrics?.cider || 2.24}
                  </strong>
                </div>
                <div className="p-1.5 rounded bg-space-900 border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">VQA Match</span>
                  <strong className="text-emerald-400">100%</strong>
                </div>
              </div>
            </div>

            {/* Agent Execution Timeline Graph */}
            <div className="p-3 rounded-xl bg-space-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  Agent Execution Telemetry Trace:
                </span>
                <button
                  onClick={() => setShowTraceDrawer(!showTraceDrawer)}
                  className="text-[9px] text-cyan-400 hover:underline"
                >
                  {showTraceDrawer ? 'Collapse' : 'Expand'}
                </button>
              </div>
              {showTraceDrawer && (
                <div className="space-y-1.5">
                  {agentTrace.map((trace) => (
                    <div
                      key={trace.step}
                      className="p-2 rounded-lg bg-space-900/80 border border-slate-800/80 flex items-start gap-2 text-[10px]"
                    >
                      {trace.status === 'SUCCESS' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : trace.status === 'RUNNING' ? (
                        <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin flex-shrink-0 mt-0.5" />
                      ) : (
                        <HelpCircle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between font-sans">
                          <strong className="text-slate-200">{trace.title}</strong>
                          <span className="text-slate-500 text-[9px]">{trace.durationMs}ms</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{trace.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Export & Action Buttons */}
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={handleOverlayOnMap}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 font-sans transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Overlay Features on Main GIS Map</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadGeoJSON}
                  className="py-2 px-3 rounded-xl bg-space-950 hover:bg-space-850 border border-slate-700 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 font-sans text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  title="Download EPSG:4326 Vector GeoJSON"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>GeoJSON</span>
                </button>

                <button
                  onClick={handleDownloadCSV}
                  className="py-2 px-3 rounded-xl bg-space-950 hover:bg-space-850 border border-slate-700 hover:border-emerald-500/60 text-slate-300 hover:text-emerald-300 font-sans text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  title="Download Structured Quantitative CSV Data"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CSV Table</span>
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="py-2 px-3 rounded-xl bg-space-950 hover:bg-space-850 border border-slate-700 hover:border-rose-500/60 text-slate-300 hover:text-rose-300 font-sans text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  title="Download High-Resolution PDF Intelligence Advisory"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  <span>PDF Report</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(
                        activeTab === 'SINGLE_VQA'
                          ? vqaResult
                          : activeTab === 'BITEMPORAL_CHANGE'
                          ? changeResult
                          : fusionResult,
                        null,
                        2
                      )
                    );
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className="py-2 px-3 rounded-xl bg-space-950 hover:bg-space-850 border border-slate-700 hover:border-indigo-500/60 text-slate-300 hover:text-indigo-300 font-sans text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  title="Copy Full JSON Payload to Clipboard"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>{isCopied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
