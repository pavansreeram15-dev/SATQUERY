import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Dashboard/Header';
import { queryService } from '../../src/services/queryService';
import { QueryResponse } from '../../src/types/query';
import { useMapContext } from '../../src/context/MapContext';
import { exportService } from '../../src/services/exportService';
import {
  History,
  Search,
  Filter,
  ArrowUpRight,
  Database,
  Clock,
  Download,
  Calendar,
  Layers,
  FileJson,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<QueryResponse[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedIntent, setSelectedIntent] = useState<string>('ALL');
  const [selectedPersona, setSelectedPersona] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { setQueryResult } = useMapContext();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true);
      try {
        const data = await queryService.getHistory();
        setHistory(data);
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.prompt.toLowerCase().includes(search.toLowerCase()) ||
      item.summary_text.toLowerCase().includes(search.toLowerCase()) ||
      item.query_id.toLowerCase().includes(search.toLowerCase());

    const matchesIntent = selectedIntent === 'ALL' || item.intent === selectedIntent;
    const matchesPersona = selectedPersona === 'ALL' || item.persona === selectedPersona;

    return matchesSearch && matchesIntent && matchesPersona;
  });

  const handleReopenInWorkspace = (item: QueryResponse) => {
    setQueryResult(item);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col font-mono text-xs">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
              <History className="w-5 h-5" />
              <span>MISSION QUERY ARCHIVE & AUDIT LOGS</span>
            </div>
            <p className="text-slate-400 text-xs font-sans mt-0.5">
              Review and reopen historical natural language geospatial workflows and derived vector geometries.
            </p>
          </div>
          <span className="text-slate-400 text-xs">
            Total Logged Analyses: <strong className="text-cyan-300">{history.length}</strong>
          </span>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts, IDs, entities..."
              className="w-full bg-space-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          {/* Intent Filter */}
          <select
            value={selectedIntent}
            onChange={(e) => setSelectedIntent(e.target.value)}
            className="bg-space-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 cursor-pointer"
          >
            <option value="ALL">All Analysis Intents</option>
            <option value="OBJECT_DETECTION">Object Detection</option>
            <option value="OBJECT_COUNT">Object Count</option>
            <option value="FLOOD_DETECTION">Flood Detection</option>
            <option value="CHANGE_DETECTION">Change Detection</option>
            <option value="NDVI_ANALYSIS">NDVI Vegetation</option>
            <option value="NDWI_ANALYSIS">NDWI Water</option>
          </select>

          {/* Persona Filter */}
          <select
            value={selectedPersona}
            onChange={(e) => setSelectedPersona(e.target.value)}
            className="bg-space-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 cursor-pointer"
          >
            <option value="ALL">All Operational Personas</option>
            <option value="ISRO_ANALYST">ISRO / SPACE ANALYST</option>
            <option value="NDRF_OFFICER">NDRF / DISASTER OFFICER</option>
            <option value="PUBLIC_RESEARCHER">PUBLIC / RESEARCH USER</option>
          </select>
        </div>

        {/* History Table / Cards */}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-16 bg-space-900/40 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
            <History className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="font-bold text-slate-300">No Query Records Found</div>
            <p className="text-xs font-sans max-w-sm mx-auto">
              Execute natural language queries in the workspace dashboard to generate analysis history.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <div
                key={item.query_id}
                className="p-4 rounded-xl bg-space-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-850">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold text-[10px]">
                      {item.intent}
                    </span>
                    <span className="text-slate-400 text-[11px]">ID: {item.query_id}</span>
                    <span className="text-slate-500 text-[11px]">&bull;</span>
                    <span className="text-slate-300 text-[11px]">{item.persona}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {(item.processing_time_ms / 1000).toFixed(2)}s
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="font-sans text-sm text-slate-100 font-semibold">
                  "{item.prompt}"
                </div>

                <div className="text-xs text-slate-300 font-sans leading-relaxed">
                  {item.summary_text}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-850">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Source: <strong className="text-slate-200">{item.data_source}</strong></span>
                    {item.count_metric !== undefined && (
                      <span>&bull; Targets: <strong className="text-cyan-300">{item.count_metric}</strong></span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => exportService.exportPDF(item, `SATQUERY_${item.intent}_${item.query_id}`)}
                      className="px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-bold shadow-sm"
                      title="Download PDF Intelligence Briefing"
                    >
                      <FileText className="w-3 h-3 text-cyan-400" />
                      <span>PDF Report</span>
                    </button>
                    <button
                      onClick={() => exportService.downloadGeoJSON(item)}
                      className="px-2 py-1 rounded bg-space-850 hover:bg-space-800 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1 text-[11px]"
                    >
                      <FileJson className="w-3 h-3 text-cyan-400" />
                      <span>GeoJSON</span>
                    </button>
                    <button
                      onClick={() => exportService.downloadCSV(item)}
                      className="px-2 py-1 rounded bg-space-850 hover:bg-space-800 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1 text-[11px]"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                      <span>CSV</span>
                    </button>
                    <button
                      onClick={() => handleReopenInWorkspace(item)}
                      className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold flex items-center gap-1 text-[11px] shadow-sm"
                    >
                      <span>Reopen in Map</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
