import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Radio,
  Search,
  X,
  Anchor,
  Globe,
  GripHorizontal,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useMapContext } from '../../context/MapContext';
import { cableApi } from '../../services/cableApi';

export const MaritimeControlBar: React.FC = () => {
  const mapContext = useMapContext();
  const layers = mapContext?.layers || { submarineCables: true };
  const toggleLayer = mapContext?.toggleLayer || (() => {});
  const setViewportBBox = mapContext?.setViewportBBox || (() => {});

  const [isMinimized, setIsMinimized] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<{
    cables: Array<{ id: string; name: string; color?: string; owners?: string; length?: string; coordinates?: any }>;
    landing_points: Array<{ id: string; name: string; country?: string; coordinates?: [number, number] }>;
  }>({ cables: [], landing_points: [] });
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setIsSearching(true);
    try {
      const res = await cableApi.search(searchInput.trim());
      setSearchResults({
        cables: res.cables || [],
        landing_points: res.landing_points || [],
      });
    } catch (err) {
      console.warn('[MaritimeControlBar] Cable search warning:', err);
      setSearchResults({ cables: [], landing_points: [] });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLandingPoint = (coords: [number, number]) => {
    const span = 0.08;
    setViewportBBox([
      coords[0] - span,
      coords[1] - span,
      coords[0] + span,
      coords[1] + span,
    ]);
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      whileDrag={{
        scale: 1.02,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 25px rgba(6, 182, 212, 0.4)',
        cursor: 'grabbing',
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute bottom-6 right-6 z-[1000] font-mono text-xs select-none pointer-events-auto touch-none"
    >
      {isMinimized ? (
        /* Collapsed Draggable Pill Bar */
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-space-950/95 border border-cyan-500/50 shadow-2xl backdrop-blur-xl cursor-grab active:cursor-grabbing hover:border-cyan-400 transition-all group">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <GripHorizontal className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          </div>

          <span className="font-bold text-xs text-slate-200">Maritime Infrastructure</span>

          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-cyan-950 border border-cyan-500/40 text-cyan-300">
            {layers.submarineCables ? 'ON' : 'OFF'}
          </span>

          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setIsMinimized(false)}
            className="p-1 rounded-lg hover:bg-space-850 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
            title="Expand Maritime Infrastructure Panel"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Full Draggable Maritime Window */
        <div className="w-80 sm:w-96 rounded-2xl bg-space-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-2xl p-3.5 space-y-3 text-slate-100">
          {/* Header with Grip Drag Handle */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80 cursor-grab active:cursor-grabbing select-none">
            <div className="flex items-center gap-2 min-w-0">
              <GripHorizontal className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex-shrink-0">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-100 text-xs truncate flex items-center gap-1.5">
                  <span>Maritime Infrastructure</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">Submarine Cables & Terminals</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                  layers.submarineCables
                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    layers.submarineCables ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span>{layers.submarineCables ? 'ACTIVE' : 'OFF'}</span>
              </span>

              {/* Minimize Window Button */}
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-space-850 transition-colors cursor-pointer"
                title="Minimize Panel"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Submarine Cable & Landing Point Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative w-full"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search cable, landing terminal, country..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-space-900 border border-slate-700 text-slate-200 placeholder-slate-500 text-[11px] focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchResults({ cables: [], landing_points: [] });
                }}
                className="absolute right-2 top-2.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Search Results Dropdown */}
          {((searchResults?.cables?.length ?? 0) > 0 || (searchResults?.landing_points?.length ?? 0) > 0) && (
            <div
              className="p-2 rounded-xl bg-space-900/90 border border-slate-800 space-y-1.5 max-h-48 overflow-y-auto animate-in fade-in"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {searchResults.cables && searchResults.cables.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <span>Cables ({searchResults.cables.length}):</span>
                  </div>
                  {searchResults.cables.map((c) => (
                    <div
                      key={c.id}
                      className="p-1.5 rounded-lg bg-space-950/60 border border-slate-800 text-[11px] flex justify-between items-center"
                    >
                      <span className="font-bold text-slate-200 truncate pr-2">{c.name}</span>
                      <span className="text-[9px] text-slate-400 flex-shrink-0">
                        {c.length || 'Transoceanic'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.landing_points && searchResults.landing_points.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-slate-800">
                  <div className="text-[10px] text-sky-400 font-bold uppercase flex items-center gap-1">
                    <Anchor className="w-3 h-3" />
                    <span>Landing Terminals ({searchResults.landing_points.length}):</span>
                  </div>
                  {searchResults.landing_points.map((lp) => (
                    <button
                      key={lp.id}
                      onClick={() => lp.coordinates && handleSelectLandingPoint(lp.coordinates)}
                      className="w-full text-left p-1.5 rounded-lg hover:bg-space-850 flex items-center justify-between text-[11px] transition-colors border border-transparent hover:border-slate-800 cursor-pointer"
                    >
                      <span className="font-bold text-slate-200 truncate pr-2">{lp.name}</span>
                      <span className="text-[9px] text-sky-300 font-mono flex-shrink-0">
                        {lp.country || 'Terminal'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submarine Cables Layer Toggle Button */}
          <div className="w-full flex items-center justify-center" onPointerDown={(e) => e.stopPropagation()}>
            <button
              onClick={() => toggleLayer('submarineCables')}
              className={`w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border shadow-lg cursor-pointer ${
                layers.submarineCables
                  ? 'bg-cyan-950/90 border-cyan-500/60 text-cyan-300 shadow-cyan-950/50 hover:bg-cyan-900/90'
                  : 'bg-space-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
              }`}
              title="Toggle Global Submarine Fiber Optic Cables (Gigawatt Map / TeleGeography — CC BY-NC-SA 3.0)"
            >
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>
                {layers.submarineCables ? 'Submarine Cables Enabled' : 'Enable Submarine Cables'}
              </span>
            </button>
          </div>

          {/* Drag instruction & Attribution Footer */}
          <div className="flex items-center justify-between text-[9px] text-slate-500 border-t border-slate-800/60 pt-2 pointer-events-none">
            <span className="flex items-center gap-1 text-slate-400">
              <GripHorizontal className="w-3 h-3" />
              <span>Drag anywhere to move</span>
            </span>
            <span>Data: TeleGeography</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};