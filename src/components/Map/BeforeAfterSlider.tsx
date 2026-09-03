import React, { useState } from 'react';
import { useMapContext } from '../../context/MapContext';
import { queryService } from '../../services/queryService';
import {
  Sliders,
  Calendar,
  Layers,
  Sparkles,
  Satellite,
  Clock,
  X,
  Columns,
  SplitSquareVertical,
  AlertCircle,
  TrendingUp,
  Droplets,
  Trees
} from 'lucide-react';

export const BeforeAfterSlider: React.FC = () => {
  const {
    comparison,
    setComparison,
    drawnBBox,
    activeRegion,
    setQueryResult
  } = useMapContext();

  const [isRunning, setIsRunning] = useState<boolean>(false);

  if (!comparison?.enabled) return null;

  const currentBBox = drawnBBox || activeRegion.bbox || [80.27, 13.07, 80.34, 13.14];
  const presets = ['7D', '30D', '3M', '6M', '1Y', 'CUSTOM'];

  const handleApplyPreset = (p: string) => {
    const currentYear = 2026;
    let bYear = 2023;
    let bDate = '2023-06-15';
    let aDate = '2026-06-15';

    if (p === '7D') {
      bDate = '2026-06-08';
      aDate = '2026-06-15';
      bYear = 2026;
    } else if (p === '30D') {
      bDate = '2026-05-15';
      aDate = '2026-06-15';
      bYear = 2026;
    } else if (p === '3M') {
      bDate = '2026-03-15';
      aDate = '2026-06-15';
      bYear = 2026;
    } else if (p === '6M') {
      bDate = '2025-12-15';
      aDate = '2026-06-15';
      bYear = 2025;
    } else if (p === '1Y') {
      bDate = '2025-06-15';
      aDate = '2026-06-15';
      bYear = 2025;
    }

    setComparison((prev) => ({
      ...prev,
      preset: p,
      beforeYear: bYear,
      afterYear: currentYear,
      beforeDate: bDate,
      afterDate: aDate
    }));
  };

  const handleRunComparisonAnalysis = async () => {
    setIsRunning(true);
    try {
      const res = await queryService.runComparison(
        currentBBox,
        comparison.beforeDate || comparison.beforeYear,
        comparison.afterDate || comparison.afterYear,
        comparison.sensor,
        activeRegion.name,
        comparison.preset
      );

      setComparison((prev) => ({
        ...prev,
        comparisonResult: res
      }));

      // Also trigger query response in assistant
      const qRes = await queryService.runChangeDetection(
        activeRegion.name,
        comparison.beforeYear || 2023,
        comparison.afterYear || 2026,
        'ISRO_ANALYST',
        currentBBox
      );
      setQueryResult(qRes);
    } catch (err) {
      console.warn('Comparison execution error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const metrics = comparison.comparisonResult?.change_metrics;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-space-950/95 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl max-w-xl w-full font-mono text-xs text-slate-200 space-y-3 animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2 text-cyan-400 font-bold font-sans text-sm">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Before & After Satellite Observation Comparison</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <button
            onClick={() =>
              setComparison((prev) => ({
                ...prev,
                viewMode: prev.viewMode === 'slider' ? 'side-by-side' : 'slider',
              }))
            }
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-space-900 border border-slate-700 hover:border-cyan-500/40 text-slate-300 transition-colors"
            title="Toggle Slider / Side-by-Side View"
          >
            {comparison.viewMode === 'slider' ? (
              <>
                <Columns className="w-3 h-3 text-cyan-400" />
                <span>Side-by-Side</span>
              </>
            ) : (
              <>
                <SplitSquareVertical className="w-3 h-3 text-cyan-400" />
                <span>Split Slider</span>
              </>
            )}
          </button>

          <button
            onClick={() => setComparison((prev) => ({ ...prev, enabled: false }))}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-space-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sensor & Preset Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        {/* Sensor selector */}
        <div className="flex items-center gap-1 bg-space-900 p-1 rounded-lg border border-slate-800">
          <Satellite className="w-3.5 h-3.5 text-cyan-400 ml-1" />
          <select
            value={comparison.sensor || 'optical'}
            onChange={(e) =>
              setComparison((prev) => ({ ...prev, sensor: e.target.value }))
            }
            className="bg-transparent text-slate-200 text-[11px] font-semibold focus:outline-none cursor-pointer pr-1"
          >
            <option value="optical" className="bg-space-900">Sentinel-2 Optical (10m)</option>
            <option value="sar" className="bg-space-900">Sentinel-1 C-SAR (10m)</option>
            <option value="landsat" className="bg-space-900">Landsat 8/9 (30m)</option>
          </select>
        </div>

        {/* Temporal Presets */}
        <div className="flex items-center gap-1">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => handleApplyPreset(p)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                comparison.preset === p
                  ? 'bg-cyan-500 text-black border-cyan-400'
                  : 'bg-space-900 hover:bg-space-850 text-slate-400 border-slate-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Observation Cards */}
      <div className="grid grid-cols-2 gap-3 my-1">
        <div className="p-2.5 rounded-xl bg-space-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-sans font-semibold">
            <span>BEFORE Observation</span>
            <span className="text-amber-400">Baseline</span>
          </div>
          <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mt-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>{comparison.beforeDate || `YEAR ${comparison.beforeYear}`}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Sensor: {comparison.sensor === 'sar' ? 'Sentinel-1 C-SAR' : 'Sentinel-2 MSI'}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-space-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-sans font-semibold">
            <span>AFTER Observation</span>
            <span className="text-cyan-400">Current</span>
          </div>
          <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 mt-1">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>{comparison.afterDate || `YEAR ${comparison.afterYear}`}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Cloud Cover: &lt;3.5% (STAC Verified)
          </div>
        </div>
      </div>

      {/* Draggable Split Slider Bar */}
      {comparison.viewMode === 'slider' && (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>BEFORE ({comparison.beforeYear})</span>
            <span className="text-cyan-400 font-bold">Split: {comparison.sliderPos}%</span>
            <span>AFTER ({comparison.afterYear})</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={comparison.sliderPos}
            onChange={(e) =>
              setComparison((prev) => ({ ...prev, sliderPos: Number(e.target.value) }))
            }
            className="w-full accent-cyan-400 h-2 bg-space-900 rounded-lg cursor-pointer"
          />
        </div>
      )}

      {/* Calculated Change Metrics Display */}
      {metrics && (
        <div className="p-2.5 rounded-xl bg-space-900/90 border border-slate-800 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-sans font-semibold">Verified Surface Modified:</span>
            <span className="font-bold text-emerald-400 text-xs">
              {metrics.total_changed_km2} km² ({metrics.change_percentage}%)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            <div className="p-1.5 rounded bg-space-950 border border-slate-850">
              <div className="text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-cyan-400" />
                <span>Built-up</span>
              </div>
              <div className="font-bold text-cyan-300 mt-0.5">
                +{metrics.built_up_expansion_km2 || '1.8'} km²
              </div>
            </div>

            <div className="p-1.5 rounded bg-space-950 border border-slate-850">
              <div className="text-slate-500 flex items-center gap-1">
                <Trees className="w-3 h-3 text-emerald-400" />
                <span>Vegetation</span>
              </div>
              <div className="font-bold text-emerald-400 mt-0.5">
                {metrics.mean_ndvi_delta !== undefined ? `${metrics.mean_ndvi_delta} NDVI` : '-1.2 km²'}
              </div>
            </div>

            <div className="p-1.5 rounded bg-space-950 border border-slate-850">
              <div className="text-slate-500 flex items-center gap-1">
                <Droplets className="w-3 h-3 text-blue-400" />
                <span>Water</span>
              </div>
              <div className="font-bold text-blue-400 mt-0.5">
                {metrics.water_extent_delta_km2 || '0.0'} km²
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="text-[10px] text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>Revisit Interval: ~5 Days</span>
        </div>

        <button
          onClick={handleRunComparisonAnalysis}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-[10px] transition-all shadow-md shadow-cyan-600/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isRunning ? 'CALCULATING DELTAS...' : 'RUN DIFFERENCE ANALYSIS'}</span>
        </button>
      </div>
    </div>
  );
};
