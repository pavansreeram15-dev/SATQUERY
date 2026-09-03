import React from 'react';
import { useMapContext } from '../../context/MapContext';
import {
  X,
  Radio,
  Satellite,
  Layers,
  ExternalLink,
  Sliders,
  Calendar,
  Compass,
  AlertTriangle,
  Flame,
  Wind,
  Droplets,
  Activity,
  CheckCircle2,
  Share2,
  Sun,
  ShieldAlert
import { motion } from 'framer-motion';

export const DisasterInfoPanel: React.FC = () => {
  const {
    selectedDisaster,
    setSelectedDisaster,
    triggerSatelliteAnalysisForDisaster,
    setComparison,
  } = useMapContext();

  if (!selectedDisaster) return null;

  const d = selectedDisaster;
  const lat = typeof d.latitude === 'number' ? d.latitude : 0.0;
  const lon = typeof d.longitude === 'number' ? d.longitude : 0.0;
  const isEarthquake = d.type === 'earthquake';
  const isWildfire = d.type === 'wildfire';
  const hasNumericMag = typeof d.magnitude === 'number' && d.magnitude > 0;

  const handleStartAnalysis = () => {
    if (triggerSatelliteAnalysisForDisaster) {
      triggerSatelliteAnalysisForDisaster(d);
    }
  };

  const handleStartComparison = () => {
    if (triggerSatelliteAnalysisForDisaster) {
      triggerSatelliteAnalysisForDisaster(d);
    }
    if (setComparison) {
      setComparison((prev) => ({
        ...prev,
        enabled: true,
        beforeYear: 2023,
        afterYear: 2026,
        sliderPos: 50,
      }));
    }
  };

  const getHazardIcon = (type?: string) => {
    switch (type) {
      case 'earthquake':
        return <Activity className="w-4 h-4 text-red-400" />;
      case 'wildfire':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'drought':
        return <Sun className="w-4 h-4 text-amber-400" />;
      case 'cyclone':
      case 'storm':
        return <Wind className="w-4 h-4 text-cyan-400" />;
      case 'flood':
      case 'tsunami':
        return <Droplets className="w-4 h-4 text-blue-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  const timeAgo = (iso?: string) => {
    if (!iso) return 'Recent';
    try {
      const diffMs = Date.now() - new Date(iso).getTime();
      if (isNaN(diffMs)) return 'Recent';
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 60) return `${Math.max(1, diffMins)} minutes ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hours ago`;
      return `${Math.floor(diffHours / 24)} days ago`;
    } catch {
      return 'Recent';
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute bottom-6 right-6 z-[450] w-96 max-w-[calc(100vw-2rem)] rounded-2xl bg-space-950/98 border border-cyan-500/50 shadow-2xl backdrop-blur-2xl p-4 font-mono text-xs text-slate-200 cursor-grab active:cursor-grabbing select-none animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-space-900 border border-slate-800 flex items-center justify-center">
            {getHazardIcon(d.type)}
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-xs font-sans">
              <span className="uppercase">{d.type || 'EARTH'} INTELLIGENCE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            </div>
            <div className="text-[10px] text-slate-400 font-sans">{timeAgo(d.start_time)}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
              d.alert_level === 'red' || d.severity === 'critical'
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                : d.alert_level === 'orange' || d.severity === 'severe' || d.severity === 'major'
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                : 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
            }`}
          >
            {d.severity || 'MODERATE'}
          </span>
          <button
            onClick={() => setSelectedDisaster(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-space-850 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title & Description */}
      <div className="mt-2.5">
        <h3 className="text-sm font-bold font-sans text-slate-100 leading-snug">{d.title || 'Earth Event'}</h3>
        {d.description && (
          <p className="mt-1 text-[11px] font-sans text-slate-300 line-clamp-2 leading-relaxed">
            {d.description}
          </p>
        )}
      </div>

      {/* Quantitative Telemetry Grid */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 rounded-xl bg-space-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-sans">Coordinates</div>
          <div className="text-cyan-300 font-bold font-mono mt-0.5 text-xs truncate">
            {lat.toFixed(3)}°, {lon.toFixed(3)}°
          </div>
        </div>

        <div className="p-2 rounded-xl bg-space-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-sans">
            {isEarthquake ? 'Magnitude' : isWildfire ? 'Radiative Power' : 'Alert Level'}
          </div>
          <div className="text-amber-300 font-bold font-mono mt-0.5 text-xs">
            {hasNumericMag ? (
              `${isEarthquake ? 'M' : ''}${typeof d.magnitude === 'number' ? d.magnitude.toFixed(1) : d.magnitude} ${isWildfire ? 'MW' : ''}`
            ) : (
              d.alert_level === 'red' || d.severity === 'critical' ? 'Red Alert Level' : 'Monitored Severity'
            )}
          </div>
        </div>

        {d.depth_km !== undefined && d.depth_km !== null && (
          <div className="p-2 rounded-xl bg-space-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-sans">Hypocenter Depth</div>
            <div className="text-slate-200 font-bold font-mono mt-0.5 text-xs">
              {typeof d.depth_km === 'number' ? d.depth_km.toFixed(1) : d.depth_km} km
            </div>
          </div>
        )}

        <div className="p-2 rounded-xl bg-space-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-sans">Confidence</div>
          <div className="text-emerald-400 font-bold font-mono mt-0.5 text-xs">
            {d.confidence ? `${(d.confidence * 100).toFixed(0)}%` : '95%'}
          </div>
        </div>
      </div>

      {/* Multi-Source Attribution Badges */}
      <div className="mt-2.5 p-2 rounded-xl bg-space-900/60 border border-slate-800/80 flex items-center justify-between text-[10px]">
        <span className="text-slate-400">Reporting Sources:</span>
        <div className="flex items-center gap-1">
          {(d.sources && d.sources.length > 0 ? d.sources : [d.source || 'USGS']).map((src) => (
            <span
              key={src}
              className="px-1.5 py-0.5 rounded bg-space-850 border border-cyan-500/30 text-cyan-300 font-bold font-mono"
            >
              {src}
            </span>
          ))}
        </div>
      </div>

      {/* Sentinel Hub & Action Buttons */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col gap-2">
        <button
          onClick={handleStartAnalysis}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs transition-all shadow-lg shadow-cyan-600/25"
        >
          <Satellite className="w-4 h-4" />
          <span>Analyze with Satellite Imagery (Sentinel-2 / SAR)</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleStartComparison}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-space-850 hover:bg-space-800 border border-slate-700 hover:border-amber-500/40 text-slate-200 hover:text-amber-300 text-[11px] transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Before / After Comparison</span>
          </button>

          {d.source_url && (
            <a
              href={d.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-space-850 hover:bg-space-800 border border-slate-700 text-slate-300 hover:text-cyan-300 text-[11px] transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Official Advisory</span>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};
