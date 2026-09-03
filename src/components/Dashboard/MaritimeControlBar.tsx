import React, { useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Radio, Search, X, Anchor, Globe, GripHorizontal } from 'lucide-react';
import { useMapContext } from '../../context/MapContext';
import { cableApi } from '../../services/cableApi';

export const MaritimeControlBar: React.FC = () => {
  const mapContext = useMapContext();
  const layers = mapContext?.layers || { submarineCables: true };
  const toggleLayer = mapContext?.toggleLayer || (() => { });
  const setViewportBBox = mapContext?.setViewportBBox || (() => { });

  const [isOpen, setIsOpen] = useState(true);
  const dragControls = useDragControls();

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

  if (!isOpen) {
    return (
      <div className="absolute top-16 left-14 z-[1000]">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-space-900/95 border border-cyan-500/50 text-cyan-300 shadow-2xl backdrop-blur-md text-xs font-mono font-bold hover:bg-space-850 hover:border-cyan-400 transition-all cursor-pointer"
          title="Open Global Maritime Infrastructure Panel"
        >
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>🌐 Submarine Cables Panel</span>
        </button>
      </div>
    );
  }

  return (
    <motion.div
      drag
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      className="absolute top-16 left-14 z-[1000] max-w-sm w-80 sm:w-96 select-none"
    >
      <div className="rounded-2xl bg-space-900/95 border border-slate-800 shadow-2xl backdrop-blur-md p-3.5 text-xs text-slate-100 space-y-3 font-mono">

        {/* Movable Window Header (Primary Drag Handle) */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <div className="flex items-center gap-2 pointer-events-none">
            <GripHorizontal className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                <span>Global Maritime Infrastructure</span>
              </div>
              <div className="text-[10px] text-slate-400">Submarine Cables & Landing Terminals</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ACTIVE</span>
            </span>

            {/* X Close Button */}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Window"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Submarine Cable & Landing Point Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search cable, landing terminal, country..."
            className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-space-950 border border-slate-700 text-slate-200 placeholder-slate-500 text-[11px] focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchResults({ cables: [], landing_points: [] });
              }}
              className="absolute right-2 top-2.5 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Search Results Dropdown */}
        {((searchResults?.cables?.length ?? 0) > 0 || (searchResults?.landing_points?.length ?? 0) > 0) && (
          <div className="p-2 rounded-xl bg-space-950 border border-slate-800 space-y-1.5 max-h-48 overflow-y-auto animate-in fade-in">
            {searchResults.cables && searchResults.cables.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>Cables ({searchResults.cables.length}):</span>
                </div>
                {searchResults.cables.map((c) => (
                  <div
                    key={c.id}
                    className="p-1.5 rounded-lg bg-space-900/60 border border-slate-800 text-[11px] flex justify-between items-center"
                  >
                    <span className="font-bold text-slate-200">{c.name}</span>
                    <span className="text-[9px] text-slate-400">{c.length || 'Transoceanic'}</span>
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
                    className="w-full text-left p-1.5 rounded-lg hover:bg-space-850 flex items-center justify-between text-[11px] transition-colors border border-transparent hover:border-slate-800"
                  >
                    <span className="font-bold text-slate-200">{lp.name}</span>
                    <span className="text-[9px] text-sky-300 font-mono">{lp.country || 'Terminal'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. Submarine Cables Feature Button */}
        <div className="w-full flex items-center justify-center">
          <button
            onClick={() => toggleLayer('submarineCables')}
            className={`w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border shadow-lg cursor-pointer ${layers.submarineCables
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
    </motion.div>
  );
};