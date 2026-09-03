import React, { useEffect, useState } from 'react';
import { Header } from '../components/Dashboard/Header';
import { queryService } from '../../src/services/queryService';
import { AnalyticsSummary } from '../../src/types/query';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  BarChart2,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  Database,
  Satellite,
  ShieldAlert,
} from 'lucide-react';

const COLORS = ['#06B6D4', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true);
      try {
        const summary = await queryService.getAnalytics();
        setData(summary);
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col font-mono">
        <Header />
        <div className="flex-1 flex items-center justify-center text-slate-400">Loading Analytics...</div>
      </div>
    );
  }

  // Format intent chart data
  const intentChartData = Object.entries(data.intent_distribution || {}).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    queries: value,
  }));

  // Format source chart data
  const sourceChartData = Object.entries(data.data_source_distribution || {}).map(([name, value]) => ({
    name,
    count: value,
  }));

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col font-mono text-xs">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
              <BarChart2 className="w-5 h-5" />
              <span>GEOSPATIAL INTELLIGENCE & TELEMETRY ANALYTICS</span>
            </div>
            <p className="text-slate-400 text-xs font-sans mt-0.5">
              Live quantitative analysis metrics, model inference confidence distributions, and remote sensing routing telemetry.
            </p>
          </div>
          <span className="text-emerald-400 font-mono text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Ingest Active
          </span>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-space-900/80 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase">Total Analyses Executed</div>
            <div className="text-2xl font-bold text-cyan-300 font-mono">{data.total_queries}</div>
            <div className="text-[10px] text-slate-500 font-sans">Across 7 pre-indexed regions</div>
          </div>

          <div className="p-4 rounded-xl bg-space-900/80 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase">Classified Ground Targets</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{data.total_detections}</div>
            <div className="text-[10px] text-slate-500 font-sans">Ships, tanks, flood zones, change</div>
          </div>

          <div className="p-4 rounded-xl bg-space-900/80 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase">Mean Model Confidence</div>
            <div className="text-2xl font-bold text-amber-300 font-mono">
              {(data.average_confidence * 100).toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500 font-sans">Weighted multi-spectral confidence</div>
          </div>

          <div className="p-4 rounded-xl bg-space-900/80 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase">Mean Execution Latency</div>
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {(data.average_processing_time_ms / 1000).toFixed(2)}s
            </div>
            <div className="text-[10px] text-slate-500 font-sans">Vectorization & GIS pipeline</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Query Activity Trend */}
          <div className="p-5 rounded-2xl bg-space-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-cyan-300 text-xs">
                <TrendingUp className="w-4 h-4" />
                <span>HOURLY QUERY & INFERENCE INGESTION TREND</span>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.recent_activity_trend}>
                  <defs>
                    <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="queries"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorQueries)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Intent Distribution */}
          <div className="p-5 rounded-2xl bg-space-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-cyan-300 text-xs">
                <BarChart2 className="w-4 h-4" />
                <span>ANALYSIS INTENT CLASSIFICATION BREAKDOWN</span>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={intentChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={9} interval={0} angle={-15} textAnchor="end" />
                  <YAxis stroke="#64748B" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px' }}
                  />
                  <Bar dataKey="queries" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Confidence Distribution Histogram */}
          <div className="p-5 rounded-2xl bg-space-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-emerald-400 text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>DETECTION CONFIDENCE HISTOGRAM</span>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.confidence_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="range" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Source Breakdown */}
          <div className="p-5 rounded-2xl bg-space-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-amber-400 text-xs">
                <Database className="w-4 h-4" />
                <span>DATA SOURCE ROUTER ATTRIBUTION</span>
              </div>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {sourceChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
