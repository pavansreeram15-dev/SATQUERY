import React from 'react';
import { Radio, Layers } from 'lucide-react';
import { useMapContext } from '../../context/MapContext';

export const MaritimeControlBar: React.FC = () => {
  const { layers, toggleLayer } = useMapContext();

  return (
    <div className="rounded-2xl bg-space-900/90 border border-slate-800 shadow-2xl backdrop-blur-md p-3 text-xs text-slate-100 space-y-3 font-mono">
      {/* Header & Telemetry Status */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
              <span>Global Maritime Infrastructure</span>
            </div>
            <div className="text-[10px] text-slate-400">Submarine Cables & Landing Terminals</div>
          </div>
        </div>

        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>CABLES ACTIVE</span>
        </span>
      </div>

      {/* Feature Layer Button */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => toggleLayer('submarineCables')}
          className={`w-full flex items-center justify-center gap-2.5 px-4 py-2 rounded-xl font-bold text-xs transition-all border shadow-lg ${
            layers.submarineCables
              ? 'bg-cyan-950/90 border-cyan-500/60 text-cyan-300 shadow-cyan-950/50'
              : 'bg-space-850 border-slate-700 text-slate-400 hover:text-white'
          }`}
          title="Toggle Global Submarine Fiber Optic Cables (Gigawatt Map / TeleGeography — CC BY-NC-SA 3.0)"
        >
          <Radio className="w-4 h-4 text-cyan-400" />
          <span>🌐 Submarine Cables</span>
        </button>
      </div>

      {/* Attribution Footer */}
      <div className="text-[9px] text-slate-500 text-center border-t border-slate-800/60 pt-2">
        Data: <strong className="text-slate-400">Gigawatt Map / TeleGeography</strong> &mdash; CC BY-NC-SA 3.0
      </div>
    </div>
  );
};
