import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Cpu, Satellite, Layers, CloudSun, BarChart2, Sparkles } from 'lucide-react';

const PIPELINE_STAGES = [
  { text: 'Understanding your geospatial query...', icon: Cpu },
  { text: 'Validating the selected survey AOI bounds...', icon: Layers },
  { text: 'Searching Planetary Computer & Copernicus STAC catalogs...', icon: Satellite },
  { text: 'Fetching Open-Meteo rainfall & environmental context...', icon: CloudSun },
  { text: 'Processing multi-spectral reflectance & SAR backscatter...', icon: Cpu },
  { text: 'Generating georeferenced vector features (EPSG:4326)...', icon: Layers },
  { text: 'Synthesizing evidence-first intelligence report...', icon: Sparkles },
];

export const AnalysisLoader: React.FC = () => {
  const [currentStage, setCurrentStage] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < PIPELINE_STAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 320);

    return () => clearInterval(interval);
  }, []);

  const progressPct = Math.round(((currentStage + 1) / PIPELINE_STAGES.length) * 100);

  return (
    <div className="p-4 rounded-2xl bg-space-900/90 border border-cyan-500/30 shadow-2xl backdrop-blur-md font-mono text-xs text-slate-200 space-y-3 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-400 font-bold font-sans">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Analyzing Satellite & Environmental Telemetry...</span>
        </div>
        <span className="text-[11px] font-bold text-cyan-300 font-mono">{progressPct}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-space-950 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 transition-all duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Pipeline Steps Log */}
      <div className="space-y-1.5 pt-1">
        {PIPELINE_STAGES.slice(0, currentStage + 1).map((stage, idx) => {
          const isCurrent = idx === currentStage;
          const isDone = idx < currentStage;
          const Icon = stage.icon;

          return (
            <div
              key={idx}
              className={`flex items-center gap-2 text-[11px] transition-all duration-200 ${
                isCurrent
                  ? 'text-cyan-300 font-bold pl-1 border-l-2 border-cyan-400'
                  : isDone
                  ? 'text-slate-400 opacity-80'
                  : 'text-slate-600'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              ) : (
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isCurrent ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`} />
              )}
              <span className="truncate font-sans">{stage.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
