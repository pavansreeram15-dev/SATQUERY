import React from 'react';
import { useMapContext } from '../../context/MapContext';
import { SAMPLE_REGIONS } from '../../config/sampleRegions';
import { MapPin, ChevronDown } from 'lucide-react';

export const RegionSelector: React.FC = () => {
  const { activeRegion, selectRegionById } = useMapContext();
  const safeRegion = activeRegion || SAMPLE_REGIONS[0];

  return (
    <div className="relative inline-block font-mono text-xs">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-900/90 border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 transition-all shadow-sm">
        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
        <select
          value={safeRegion.id || SAMPLE_REGIONS[0].id}
          onChange={(e) => {
            if (selectRegionById) selectRegionById(e.target.value);
          }}
          className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer pr-2"
        >
          {SAMPLE_REGIONS.map((reg) => (
            <option key={reg.id} value={reg.id} className="bg-space-900 text-slate-200">
              {reg.name} ({reg.category})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
