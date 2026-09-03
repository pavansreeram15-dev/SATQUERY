import React, { useState, useMemo } from 'react';
import { useMapContext } from '../../context/MapContext';
import { DisasterType, TimeRangeOption } from '../../types/disaster';
import {
  Radio,
  Clock,
  Filter,
  Flame,
  Activity,
  Wind,
  Droplets,
  Mountain,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Layers,
  Sparkles,
  SunMedium,
} from 'lucide-react';
import { motion } from 'framer-motion';

const TIME_OPTIONS: { label: string; value: TimeRangeOption }[] = [
  { label: '1 Hour', value: '1h' },
  { label: '24 Hours', value: '24h' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: 'All', value: 'all' },
];

const HAZARD_TYPES: { label: string; type: DisasterType; icon: string; color: string }[] = [
  { label: 'Earthquakes', type: 'earthquake', icon: '🔴', color: 'text-red-400' },
  { label: 'Wildfires', type: 'wildfire', icon: '🔥', color: 'text-orange-400' },
  { label: 'Cyclones & Storms', type: 'cyclone', icon: '🌀', color: 'text-cyan-400' },
  { label: 'Floods & Tsunamis', type: 'flood', icon: '🌊', color: 'text-blue-400' },
  { label: 'Volcanoes', type: 'volcano', icon: '🌋', color: 'text-rose-400' },
  { label: 'Droughts & Aridity', type: 'drought', icon: '☀️', color: 'text-amber-400' },
];

export const DisasterFilterBar: React.FC = () => {
  const { layers, disasterFilters, setDisasterFilters, disastersData } = useMapContext();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const currentFilters = disasterFilters || {
    timeRange: '24h',
    selectedTypes: [],
    selectedSeverities: [],
    selectedSource: 'ALL',
    searchQuery: '',
  };

  const selectedTypes = currentFilters.selectedTypes || [];
  const selectedSeverities = currentFilters.selectedSeverities || [];
  const features = disastersData?.features || [];

  // Calculate live matching count synchronized immediately with active filters & time range
  const activeCount = useMemo(() => {
    if (!features || features.length === 0) return 0;

    const nowMs = Date.now();
    const cutoffMs =
      currentFilters.timeRange === '1h'
        ? nowMs - 1 * 3600 * 1000
        : currentFilters.timeRange === '24h'
        ? nowMs - 24 * 3600 * 1000
        : currentFilters.timeRange === '7d'
        ? nowMs - 7 * 24 * 3600 * 1000
        : currentFilters.timeRange === '30d'
        ? nowMs - 30 * 24 * 3600 * 1000
        : 0;

    return features.filter((feat) => {
      if (!feat || !feat.properties) return false;
      const p = feat.properties;

      // 1. Time filter
      if (cutoffMs > 0 && p.start_time) {
        const t = new Date(p.start_time).getTime();
        if (!isNaN(t) && t < cutoffMs) return false;
      }

      // 2. Source filter
      if (currentFilters.selectedSource && currentFilters.selectedSource !== 'ALL') {
        const sources = p.sources || (p.source ? [p.source] : []);
        if (!sources.some((s: string) => s.toUpperCase() === currentFilters.selectedSource.toUpperCase())) {
          return false;
        }
      }

      // 3. Hazard types filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(p.type)) {
        return false;
      }

      // 4. Severity filter
      if (selectedSeverities.length > 0 && !selectedSeverities.includes(p.severity)) {
        return false;
      }

      // 5. Search query
      if (currentFilters.searchQuery) {
        const q = currentFilters.searchQuery.toLowerCase();
        const matchesTitle = (p.title || '').toLowerCase().includes(q);
        const matchesCountry = (p.country || '').toLowerCase().includes(q);
        const matchesRegion = (p.region || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCountry && !matchesRegion) return false;
      }

      return true;
    }).length;
  }, [features, currentFilters.timeRange, currentFilters.selectedSource, currentFilters.searchQuery, selectedTypes, selectedSeverities]);

  if (!layers?.liveDisasters) return null;

  const handleToggleType = (type: DisasterType) => {
    if (!setDisasterFilters) return;
    setDisasterFilters((prev) => {
      const prevTypes = prev?.selectedTypes || [];
      const exists = prevTypes.includes(type);
      const newTypes = exists
        ? prevTypes.filter((t) => t !== type)
        : [...prevTypes, type];
      return { ...(prev || currentFilters), selectedTypes: newTypes };
    });
  };

  const handleSetTimeRange = (range: TimeRangeOption) => {
    if (!setDisasterFilters) return;
    setDisasterFilters((prev) => ({ ...(prev || currentFilters), timeRange: range }));
  };

  const handleSetSource = (source: string) => {
    if (!setDisasterFilters) return;
    setDisasterFilters((prev) => ({ ...(prev || currentFilters), selectedSource: source }));
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute top-4 left-4 z-[380] font-mono text-xs select-none cursor-grab active:cursor-grabbing"
    >
      {/* Collapsed Pill Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-space-950/90 border border-cyan-500/40 shadow-2xl backdrop-blur-xl">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-space-900 hover:bg-space-850 border border-slate-800 text-slate-200 hover:text-cyan-300 transition-colors"
        >
          <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span className="font-bold text-xs">Live Disasters</span>
          <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 border border-cyan-500/40 text-[10px] text-cyan-300 font-bold">
            {activeCount}
          </span>
          {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
        </button>

        {/* Quick Time Range Selector */}
        <div className="hidden sm:flex items-center gap-1 bg-space-900/80 p-0.5 rounded-lg border border-slate-800">
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSetTimeRange(opt.value)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                currentFilters.timeRange === opt.value
                  ? 'bg-cyan-600 text-black shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.value.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Multi-Hazard Filter Drawer */}
      {isExpanded && (
        <div className="mt-2 w-80 rounded-2xl bg-space-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-2xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-slate-400">
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
              Disaster Feeds & Filters
            </span>
            <span className="text-[9px] text-slate-500">Continuous Polling</span>
          </div>

          {/* Time Window Buttons */}
          <div className="space-y-1">
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Observation Window</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSetTimeRange(opt.value)}
                  className={`py-1 rounded-lg text-[10px] font-bold border transition-all text-center ${
                    currentFilters.timeRange === opt.value
                      ? 'bg-cyan-600 text-black border-cyan-400'
                      : 'bg-space-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {opt.value}
                </button>
              ))}
            </div>
          </div>

          {/* Hazard Types Multi-Select */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Filter className="w-3 h-3 text-amber-400" />
                <span>Hazard Categories</span>
              </span>
              {selectedTypes.length > 0 && (
                <button
                  onClick={() => setDisasterFilters((p) => ({ ...(p || currentFilters), selectedTypes: [] }))}
                  className="text-[9px] text-cyan-400 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {HAZARD_TYPES.map((h) => {
                const isSelected = selectedTypes.includes(h.type);
                return (
                  <button
                    key={h.type}
                    onClick={() => handleToggleType(h.type)}
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[11px] text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200'
                        : 'bg-space-900/80 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span>{h.icon}</span>
                    <span className="truncate text-[10px]">{h.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Provider Sources Filter */}
          <div className="space-y-1">
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>Data Provider Source</span>
            </div>
            <div className="grid grid-cols-5 gap-1 text-[9px] font-bold text-center">
              {['ALL', 'USGS', 'EONET', 'FIRMS', 'GDACS'].map((src) => (
                <button
                  key={src}
                  onClick={() => handleSetSource(src)}
                  className={`py-1 rounded border transition-all ${
                    currentFilters.selectedSource === src
                      ? 'bg-amber-500 text-black border-amber-400'
                      : 'bg-space-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>

          {/* Attribution Footer */}
          <div className="pt-2 border-t border-slate-800 text-[9px] text-slate-500 flex items-center justify-between">
            <span>Sources: USGS · EONET · FIRMS · GDACS</span>
            <span className="text-cyan-400 font-bold">WGS84</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
