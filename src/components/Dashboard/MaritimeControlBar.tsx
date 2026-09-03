import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useMap } from 'react-leaflet';
import { useMapContext } from '../../context/MapContext';
import { maritimeApi, GLOBAL_MARITIME_PORTS } from '../../services/maritimeApi';
import { MaritimePort } from '../../types/maritime';
import {
  Anchor,
  Ship,
  Search,
  ChevronDown,
  ChevronUp,
  GripHorizontal,
  Navigation,
  ExternalLink,
  Layers,
  Activity,
  Shield,
} from 'lucide-react';

export const MaritimeControlBar: React.FC = () => {
  const map = useMap();
  const { layers, toggleLayer, setViewportBBox, setDrawnBBox, setQueryResult } = useMapContext();

  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPort, setSelectedPort] = useState<MaritimePort | null>(null);
  const [ports, setPorts] = useState<MaritimePort[]>(GLOBAL_MARITIME_PORTS);

  useEffect(() => {
    let isMounted = true;
    maritimeApi.getPorts().then((data) => {
      if (isMounted && data?.features?.length > 0) {
        setPorts(data.features.map((f) => f.properties));
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPorts = useMemo(() => {
    if (!searchQuery.trim()) return ports;
    const q = searchQuery.toLowerCase().trim();
    return ports.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [ports, searchQuery]);

  const handleFlyToPort = useCallback(
    (port: MaritimePort) => {
      setSelectedPort(port);
      const span = 0.08;
      const portBBox: [number, number, number, number] = [
        Number((port.longitude - span).toFixed(4)),
        Number((port.latitude - span).toFixed(4)),
        Number((port.longitude + span).toFixed(4)),
        Number((port.latitude + span).toFixed(4)),
      ];
      setViewportBBox(portBBox);
      setDrawnBBox(portBBox);
      setQueryResult(null);
      map.flyTo([port.latitude, port.longitude], 13, { duration: 1.2 });
    },
    [map, setViewportBBox, setDrawnBBox, setQueryResult]
  );

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      className="absolute bottom-6 left-6 z-[450] select-none font-mono text-xs"
      onPointerDownCapture={(e) => e.stopPropagation()}
    >
      <div className="bg-space-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-xl text-slate-100 w-80 md:w-96 overflow-hidden flex flex-col">
        {/* Movable Grip Header */}
        <div className="px-3.5 py-2.5 bg-space-900/90 border-b border-slate-800/80 flex items-center justify-between cursor-move">
          <div className="flex items-center gap-2">
            <GripHorizontal className="w-4 h-4 text-cyan-400/70" />
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <Anchor className="w-4 h-4 text-cyan-400" />
              <span className="tracking-wide">MARITIME INFRASTRUCTURE</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 border border-emerald-500/50 text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-space-800 transition-colors"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Panel Content (Visible when not minimized) */}
        {!isMinimized && (
          <div className="p-3 space-y-2.5">
            {/* Quick Layer Controls Bar */}
            <div className="flex items-center justify-between gap-1.5 p-1 bg-space-900/60 border border-slate-800 rounded-xl text-[11px]">
              <button
                onClick={() => toggleLayer('maritimeInfrastructure')}
                className={`flex-1 py-1 px-2 rounded-lg flex items-center justify-center gap-1.5 font-semibold transition-all ${
                  layers.maritimeInfrastructure
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-space-850'
                }`}
              >
                <Anchor className="w-3.5 h-3.5" />
                <span>Ports Layer</span>
              </button>

              <button
                onClick={() => toggleLayer('liveAisVessels')}
                className={`flex-1 py-1 px-2 rounded-lg flex items-center justify-center gap-1.5 font-semibold transition-all ${
                  layers.liveAisVessels
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-space-850'
                }`}
              >
                <Ship className="w-3.5 h-3.5" />
                <span>AIS Fleet</span>
              </button>
            </div>

            {/* Maritime Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-cyan-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ports, terminals, UN/LOCODE..."
                className="w-full pl-8 pr-3 py-1.5 bg-space-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-colors font-sans"
              />
            </div>

            {/* Ports & Terminals List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <div className="text-[10px] uppercase font-bold text-slate-500 flex justify-between">
                <span>Global Seaports & Terminals</span>
                <span className="text-cyan-400">{filteredPorts.length} Active</span>
              </div>

              {filteredPorts.map((port) => {
                const isSelected = selectedPort?.id === port.id;
                return (
                  <div
                    key={port.id}
                    onClick={() => handleFlyToPort(port)}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-400/80 text-cyan-100 shadow-lg'
                        : 'bg-space-900/60 border-slate-800/80 hover:bg-space-850 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs font-sans text-slate-100">
                        <span className="text-cyan-400">⚓</span>
                        <span className="truncate">{port.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-cyan-300/90 font-mono">{port.code}</span>
                        <span>•</span>
                        <span>{port.country}</span>
                        <span>•</span>
                        <span className="text-amber-400 font-mono">{port.annual_traffic_teu}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-space-950 border border-slate-700 text-slate-300">
                        {port.berth_count} Berths
                      </span>
                      <span className="text-[9px] text-cyan-400 font-mono flex items-center gap-0.5">
                        <Navigation className="w-2.5 h-2.5" /> Fly
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
