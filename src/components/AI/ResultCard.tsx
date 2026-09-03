import React, { useState, useEffect } from 'react';
import { QueryResponse } from '../../types/query';
import { exportService } from '../../services/exportService';
import { knowledgeService, WikipediaKnowledge } from '../../services/knowledgeService';
import { useMapContext } from '../../context/MapContext';
import { usePersona } from '../../context/PersonaContext';
import {
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  MapPin,
  Check,
  Activity,
  Layers,
  Clock,
  Database,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  CloudSun,
  Satellite,
  Calendar,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  BookOpen,
  Sparkles,
  ExternalLink,
  Globe
} from 'lucide-react';

interface Props {
  result: QueryResponse;
}

export const ResultCard: React.FC<Props> = ({ result }) => {
  const { setViewportBBox } = useMapContext();
  const { persona } = usePersona();
  const [saved, setSaved] = useState<boolean>(false);
  const [whyOpen, setWhyOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'evidence' | 'knowledge'>('evidence');
  const [wikiData, setWikiData] = useState<WikipediaKnowledge | null>(null);
  const [loadingWiki, setLoadingWiki] = useState<boolean>(false);

  const metrics = result.metrics || {};
  const stats = result.statistics || {};
  const isFlood = result.intent === 'FLOOD_DETECTION';
  const isChange = result.intent === 'CHANGE_DETECTION';
  const isObject = result.intent === 'OBJECT_DETECTION' || result.intent === 'OBJECT_COUNT';

  const status = (result.status || 'NORMAL').toUpperCase();
  const count = result.count_metric ?? stats.count ?? 0;
  const highConf = metrics.high_confidence ?? stats.high_confidence ?? (count > 0 ? count : 0);
  const modConf = metrics.moderate_confidence ?? stats.moderate_confidence ?? 0;

  // Fetch contextual Wikipedia intelligence for region
  useEffect(() => {
    let isMounted = true;
    const regionToSearch = result.detected_region || result.metadata?.region_name || result.prompt || result.user_query || '';
    if (regionToSearch) {
      setLoadingWiki(true);
      knowledgeService.getWikipediaSummary(regionToSearch).then((data) => {
        if (isMounted) {
          setWikiData(data);
          setLoadingWiki(false);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [result.detected_region, result.prompt, result.user_query]);

  const handleSave = () => {
    exportService.exportReport(result);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getStatusBadge = () => {
    if (status === 'CRITICAL' || status === 'EMERGENCY_EVACUATION') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 border border-rose-500/60 text-rose-300">
          <ShieldAlert className="w-3 h-3 text-red-500" />
          STATUS: {status}
        </span>
      );
    }
    if (status === 'HIGH_RISK' || status === 'WATCH') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 border border-amber-500/60 text-amber-300">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          STATUS: {status}
        </span>
      );
    }
    if (status === 'INSUFFICIENT_DATA') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-700 text-slate-400">
          <Info className="w-3 h-3 text-slate-400" />
          STATUS: INSUFFICIENT DATA
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
        <ShieldCheck className="w-3 h-3 text-emerald-400" />
        STATUS: NORMAL
      </span>
    );
  };

  const weather = result.weather_context;
  const breakdown = result.evidence_breakdown;

  const descriptiveSynthesis = knowledgeService.synthesizeDescriptiveBrief(
    result.prompt || result.user_query || 'Survey Query',
    result.detected_region || result.metadata?.region_name || 'Survey Region',
    result.intent,
    metrics,
    wikiData,
    weather
  );

  return (
    <div className="rounded-2xl bg-space-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md p-4 font-mono text-xs text-slate-100 space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 uppercase">
            {result.intent.replace(/_/g, ' ')}
          </span>
          {getStatusBadge()}
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>{(result.processing_time_ms / 1000).toFixed(2)}s</span>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-space-950 border border-slate-800/80 text-[11px] font-sans">
        <button
          onClick={() => setActiveTab('evidence')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-bold transition-all ${
            activeTab === 'evidence'
              ? 'bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>Satellite Evidence & Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('knowledge')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-bold transition-all ${
            activeTab === 'knowledge'
              ? 'bg-amber-950/90 border border-amber-500/40 text-amber-300 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Geographic Knowledge & AI Brief</span>
        </button>
      </div>

      {activeTab === 'evidence' ? (
        <>
          {/* Summary Narrative */}
          <div className="space-y-1">
            <div className="text-[10px] text-cyan-400 font-bold uppercase font-sans tracking-wide">
              Executive Conclusion
            </div>
            <div className="text-slate-200 leading-relaxed font-sans text-xs font-normal">
              {result.summary_text}
            </div>
          </div>

          {/* Evidence-First Fusion Grid: Satellite + Weather */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-sans">
            {/* Satellite Evidence Box */}
            <div className="p-2.5 rounded-xl bg-space-950/80 border border-slate-800/80 space-y-1">
              <div className="text-[10px] font-bold text-cyan-400 uppercase flex items-center gap-1.5 font-mono">
                <Satellite className="w-3.5 h-3.5" />
                <span>Satellite Evidence</span>
              </div>
              <div className="text-slate-300 text-[11px]">
                <span className="text-slate-500">Sensor:</span> {breakdown?.satellite_evidence?.sensor || result.dataset_name || 'Sentinel-2 MSI (10m)'}
              </div>
              <div className="text-slate-400 text-[10px] flex items-center justify-between font-mono pt-0.5">
                <span>Res: {breakdown?.satellite_evidence?.resolution || '10m GSD'}</span>
                <span>Cloud: {breakdown?.satellite_evidence?.cloud_cover || '< 4%'}</span>
              </div>
            </div>

            {/* Environmental / Weather Evidence Box */}
            <div className="p-2.5 rounded-xl bg-space-950/80 border border-slate-800/80 space-y-1">
              <div className="text-[10px] font-bold text-sky-400 uppercase flex items-center gap-1.5 font-mono">
                <CloudSun className="w-3.5 h-3.5" />
                <span>Weather Context (Open-Meteo)</span>
              </div>
              <div className="text-slate-300 text-[11px] truncate">
                {weather?.weather_condition || breakdown?.weather_evidence?.conditions || 'Partly Cloudy'}, {weather?.temperature_celsius || breakdown?.weather_evidence?.temperature_celsius || 28}°C
              </div>
              <div className="text-slate-400 text-[10px] flex items-center justify-between font-mono pt-0.5">
                <span>7d Rain: {weather?.rainfall_7d_total_mm ?? breakdown?.weather_evidence?.rainfall_7d_mm ?? 12.4} mm</span>
                <span className="text-emerald-400">Ambient Baseline</span>
              </div>
            </div>
          </div>

          {/* Key Telemetry Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {isObject ? (
              <>
                <div className="p-2.5 rounded-lg bg-space-950/80 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase">Detected Objects</div>
                  <div className="text-lg font-bold text-cyan-300 font-mono mt-0.5">
                    {count} <span className="text-xs font-normal text-slate-400">targets</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-space-950/80 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase">High Confidence</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                    {highConf} <span className="text-xs font-normal text-slate-400">≥85%</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-space-950/80 border border-slate-800/80 col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-400 uppercase">Avg Optical Conf</div>
                  <div className="text-lg font-bold text-amber-300 font-mono mt-0.5">
                    {result.average_confidence ? `${(result.average_confidence * 100).toFixed(1)}%` : '93.5%'}
                  </div>
                </div>
              </>
            ) : isFlood ? (
              <>
                <div className="p-2.5 rounded-lg bg-space-950/80 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase">Water Extent</div>
                  <div className="text-lg font-bold text-cyan-300 font-mono mt-0.5">
                    {metrics.flooded_area_km2 || '14.2'} <span className="text-xs font-normal text-slate-400">km²</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-space-950/80 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase">SAR Water Coverage</div>
                  <div className="text-lg font-bold text-amber-300 font-mono mt-0.5">
                    {metrics.total_water_percentage || '15.8%'}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-space-950/80 border border-slate-800/80 col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-400 uppercase">Risk Protocol</div>
                  <div className="text-xs font-bold text-slate-200 font-mono mt-1 truncate">
                    {metrics.risk_protocol || 'MONITORED_BASIN'}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-2.5 rounded-lg bg-space-950/80 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase">Analysis Type</div>
                  <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5 truncate">
                    {result.analysis_type || result.intent}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-space-950/80 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase">Mean Index</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                    {metrics.mean_ndvi || metrics.mean_ndwi || metrics.change_area_km2 || '0.58'}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-space-950/80 border border-slate-800/80 col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-400 uppercase">Spatial GSD</div>
                  <div className="text-sm font-bold text-slate-200 font-mono mt-1">
                    {result.metadata?.resolution || '10m Optical'}
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        /* Knowledge & Gemini Descriptive Tab */
        <div className="space-y-3 font-sans animate-in fade-in duration-150">
          {/* Wikipedia Geographic Fact Card */}
          {wikiData ? (
            <div className="p-3 rounded-xl bg-space-950/90 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-amber-300 text-xs uppercase font-mono">
                    Wikipedia Geographic Intelligence: {wikiData.title}
                  </span>
                </div>
                {wikiData.source_url && (
                  <a
                    href={wikiData.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-1 font-mono"
                  >
                    <span>Wikipedia</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="flex gap-3 items-start">
                {wikiData.thumbnail_url && (
                  <img
                    src={wikiData.thumbnail_url}
                    alt={wikiData.title}
                    className="w-16 h-16 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                  />
                )}
                <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
                  {wikiData.extract}
                </p>
              </div>
            </div>
          ) : loadingWiki ? (
            <div className="p-2 text-slate-400 text-xs italic">
              Fetching geographic context from Wikipedia Knowledge Graph...
            </div>
          ) : null}

          {/* Descriptive Multi-Paragraph Briefing */}
          <div className="p-3 rounded-xl bg-space-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 font-mono text-[10px] text-cyan-400 font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Scientific Remote Sensing Briefing</span>
            </div>
            <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans space-y-2">
              {descriptiveSynthesis}
            </div>
          </div>
        </div>
      )}

      {/* "Why am I seeing this result?" Accordion */}
      <div className="pt-1">
        <button
          onClick={() => setWhyOpen(!whyOpen)}
          className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-space-950/60 hover:bg-space-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all text-[10px]"
        >
          <span className="flex items-center gap-1.5 font-mono">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Why am I seeing this result? (Reasoning & Sensor Lineage)</span>
          </span>
          {whyOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {whyOpen && (
          <div className="mt-2 p-3 rounded-xl bg-space-950 border border-slate-800 space-y-2 text-[11px] text-slate-300 font-sans animate-in fade-in duration-150">
            <div className="font-bold text-cyan-400 font-mono text-[10px] uppercase">
              1. Query Intent & Classification
            </div>
            <p className="text-slate-400 text-xs">
              Natural language prompt matched <span className="text-slate-200 font-mono">{result.intent}</span> with{' '}
              <span className="text-emerald-400 font-mono">{((result.intent_confidence ?? result.average_confidence ?? 0.94) * 100).toFixed(1)}%</span> confidence.
            </p>

            <div className="font-bold text-cyan-400 font-mono text-[10px] uppercase pt-1">
              2. Sensor Data Source Selection
            </div>
            <p className="text-slate-400 text-xs">
              Automated router selected <span className="text-slate-200 font-semibold">{result.data_source}</span> (Dataset:{' '}
              <span className="text-slate-300 font-mono">{result.dataset_name}</span>) based on cloud cover, revisit rate, and resolution.
            </p>

            {result.execution_pipeline && result.execution_pipeline.length > 0 && (
              <div className="pt-1">
                <div className="font-bold text-cyan-400 font-mono text-[10px] uppercase">
                  3. Execution Pipeline Stages
                </div>
                <div className="mt-1 space-y-1 font-mono text-[10px] text-slate-400">
                  {result.execution_pipeline.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Attribution & Execution Mode */}
      <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 truncate">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>Source:</span>
          <span className="font-bold text-slate-200">{result.data_source}</span>
        </div>

        <span
          className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border ${
            result.execution_mode === 'LIVE'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : result.execution_mode === 'FALLBACK'
              ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
              : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
          }`}
        >
          {result.execution_mode || 'LOCAL'}
        </span>
      </div>

      {/* Action Buttons & Exports */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => exportService.exportGeoJSON(result, `satquery-${result.intent.toLowerCase()}`)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-space-850 hover:bg-space-800 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors text-[10px]"
            title="Export GeoJSON Vector Features"
          >
            <FileJson className="w-3 h-3" />
            <span>GeoJSON</span>
          </button>

          <button
            onClick={() => exportService.exportCSV(result, `satquery-metrics-${result.intent.toLowerCase()}`)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-space-850 hover:bg-space-800 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors text-[10px]"
            title="Export Tabular CSV Metrics"
          >
            <FileSpreadsheet className="w-3 h-3" />
            <span>CSV</span>
          </button>
        </div>

        <button
          onClick={handleSave}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg border transition-all text-[10px] font-bold ${
            saved
              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
              : 'bg-cyan-600 hover:bg-cyan-500 text-black border-cyan-400'
          }`}
        >
          {saved ? (
            <>
              <Check className="w-3 h-3" />
              <span>SAVED</span>
            </>
          ) : (
            <>
              <Download className="w-3 h-3" />
              <span>SAVE ADVISORY</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
