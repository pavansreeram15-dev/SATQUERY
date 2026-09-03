import React from 'react';
import { useMapContext } from '../../context/MapContext';
import { usePersona } from '../../context/PersonaContext';
import { SAMPLE_REGIONS } from '../../config/sampleRegions';
import { Activity, Radio, Database, ShieldCheck } from 'lucide-react';

export const TelemetryBar: React.FC = () => {
  const { activeRegion, drawnBBox, queryResult } = useMapContext();
  const safeRegion = activeRegion || SAMPLE_REGIONS[0];
  const currentBBox = drawnBBox || safeRegion.bbox || [80.27, 13.07, 80.34, 13.14];

  const b0 = typeof currentBBox[0] === 'number' ? currentBBox[0].toFixed(2) : '80.27';
  const b1 = typeof currentBBox[1] === 'number' ? currentBBox[1].toFixed(2) : '13.07';
  const b2 = typeof currentBBox[2] === 'number' ? currentBBox[2].toFixed(2) : '80.34';
  const b3 = typeof currentBBox[3] === 'number' ? currentBBox[3].toFixed(2) : '13.14';

  return (
    <div className="h-7 bg-space-950 border-b border-slate-800/80 px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none overflow-x-auto">
      {/* Left: Active Region & BBOX Coordinates */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Radio className="w-3 h-3 animate-pulse" />
          <span className="font-bold text-slate-200 uppercase">{safeRegion.name || 'Chennai Port'}</span>
        </div>

        <div className="hidden sm:flex items-center gap-1">
          <span className="text-slate-500">BBOX:</span>
          <span className="text-slate-300">
            [{b0}, {b1}, {b2}, {b3}]
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          <span className="text-slate-500">DATUM:</span>
          <span className="text-cyan-300">WGS84 (EPSG:4326)</span>
        </div>
      </div>

      {/* Right: Telemetry Health & Active Sensor */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Database className="w-3 h-3 text-cyan-400" />
          <span className="text-slate-500">SOURCE:</span>
          <span className="text-slate-300 font-semibold">
            {queryResult?.data_source || 'Sentinel Hub / Multi-Sensor'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold">SYSTEM READY</span>
        </div>
      </div>
    </div>
  );
};
