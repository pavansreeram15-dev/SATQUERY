import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { useMap } from 'react-leaflet';
import { useMapContext } from '../../context/MapContext';
import { maritimeApi, GLOBAL_MARITIME_PORTS } from '../../services/maritimeApi';
import { cableApi, GLOBAL_SUBMARINE_CABLES_FALLBACK } from '../../services/cableApi';
import { MaritimePort } from '../../types/maritime';
import { SubmarineCableFeature } from '../../types/cable';
import {
  Anchor,
  Ship,
  Search,
  ChevronDown,
  ChevronUp,
  GripHorizontal,
  Navigation,
  ExternalLink,
  Network,
  Globe,
  Radio,
} from 'lucide-react';
import { useResizable } from '../../hooks';
import { ResizeHandles } from '../Common/ResizeHandles';

export const MaritimeControlBar: React.FC = () => {
  const map = useMap();
  const { layers, toggleLayer, setViewportBBox, setDrawnBBox, setQueryResult } = useMapContext();
  const dragControls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);

  const { width, height, startResize, resetSize, isResizing } = useResizable({
    initialWidth: 384,
    initialHeight: 420,
    minWidth: 280,
    maxWidth: 750,
    minHeight: 220,
    maxHeight: 750,
    storageKey: 'satquery_maritime_panel_size',
  });

  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ports' | 'cables'>('ports');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPort, setSelectedPort] = useState<MaritimePort | null>(null);
  const [selectedCable, setSelectedCable] = useState<SubmarineCableFeature | null>(null);

  const [ports, setPorts] = useState<MaritimePort[]>(GLOBAL_MARITIME_PORTS);
  const [cables, setCables] = useState<SubmarineCableFeature[]>(GLOBAL_SUBMARINE_CABLES_FALLBACK);

  useEffect(() => {
    if (panelRef.current) {
      import('leaflet').then((L) => {
        if (panelRef.current) {
          L.DomEvent.disableClickPropagation(panelRef.current);
          L.DomEvent.disableScrollPropagation(panelRef.current);
        }
      });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([maritimeApi.getPorts(), cableApi.getCables()]).then(([portsRes, cablesRes]) => {
      if (isMounted) {
        if (portsRes?.features?.length > 0) {
          setPorts(portsRes.features.map((f) => f.properties));
        }
        if (cablesRes?.features?.length > 0) {
          setCables(cablesRes.features);
        }
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

  const filteredCables = useMemo(() => {
    if (!searchQuery.trim()) return cables;
    const q = searchQuery.toLowerCase().trim();
    return cables.filter(
      (c) =>
        c.properties.name.toLowerCase().includes(q) ||
        (c.properties.owners || []).some((o) => o.toLowerCase().includes(q))
    );
  }, [cables, searchQuery]);

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

  const handleFlyToCable = useCallback(
    (cable: SubmarineCableFeature) => {
      setSelectedCable(cable);
      const coords = cable.geometry?.coordinates;
      if (coords && coords.length > 0) {
        const firstCoord = coords[0] as number[];
        if (firstCoord && firstCoord.length >= 2) {
          map.flyTo([firstCoord[1], firstCoord[0]], 6, { duration: 1.5 });
        }
      }
    },
    [map]
  );

  return (
    <motion.div
      ref={panelRef}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      className="absolute bottom-6 left-6 z-[450] select-none font-mono text-xs"
    >
      <div
        style={{
          width: `${width}px`,
          height: isMinimized ? 'auto' : typeof height === 'number' ? `${height}px` : height,
        }}
        className="relative bg-space-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-xl text-slate-100 overflow-hidden flex flex-col transition-shadow hover:shadow-cyan-500/10"
      >
        {/* Movable Grip Header */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="px-3.5 py-2.5 bg-space-900/95 border-b border-slate-800/80 flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-space-850 transition-colors select-none group flex-shrink-0"
          title="Drag to reposition window anywhere"
        >
          <div className="flex items-center gap-2 pointer-events-none">
            <GripHorizontal className="w-4 h-4 text-cyan-400/80 group-hover:text-cyan-300 transition-colors" />
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="tracking-wide">MARITIME & GIGAWATT MAP</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 border border-cyan-500/50 text-cyan-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              LIVE
            </span>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-space-800 transition-colors cursor-pointer"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Panel Content (Visible when not minimized) */}
        {!isMinimized && (
          <div className="p-3 space-y-2.5 flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Quick Layer Controls Bar */}
            <div className="flex items-center justify-between gap-1 p-1 bg-space-900/60 border border-slate-800 rounded-xl text-[10px] flex-shrink-0">
              <button
                onClick={() => toggleLayer('maritimeInfrastructure')}
                className={`flex-1 py-1 px-1.5 rounded-lg flex items-center justify-center gap-1 font-semibold transition-all ${
                  layers.maritimeInfrastructure
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-space-850'
                }`}
                title="Toggle Seaports Layer"
              >
                <Anchor className="w-3 h-3" />
                <span>Ports</span>
              </button>

              <button
                onClick={() => toggleLayer('submarineCables')}
                className={`flex-1 py-1 px-1.5 rounded-lg flex items-center justify-center gap-1 font-semibold transition-all ${
                  layers.submarineCables
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-space-850'
                }`}
                title="Toggle Gigawatt Submarine Cables Layer"
              >
                <Network className="w-3 h-3" />
                <span>Cables</span>
              </button>

              <button
                onClick={() => toggleLayer('liveAisVessels')}
                className={`flex-1 py-1 px-1.5 rounded-lg flex items-center justify-center gap-1 font-semibold transition-all ${
                  layers.liveAisVessels
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-space-850'
                }`}
                title="Toggle Live AIS Vessels"
              >
                <Ship className="w-3 h-3" />
                <span>AIS Fleet</span>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center border-b border-slate-800 gap-3 pb-1 text-[11px] flex-shrink-0">
              <button
                onClick={() => setActiveTab('ports')}
                className={`font-bold transition-colors pb-0.5 ${
                  activeTab === 'ports'
                    ? 'text-cyan-400 border-b border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚓ SEAPORTS & TERMINALS ({ports.length})
              </button>
              <button
                onClick={() => setActiveTab('cables')}
                className={`font-bold transition-colors pb-0.5 ${
                  activeTab === 'cables'
                    ? 'text-sky-400 border-b border-sky-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌐 GIGAWATT CABLES ({cables.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-shrink-0">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-cyan-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'ports'
                    ? 'Search ports, terminals, UN/LOCODE...'
                    : 'Search submarine cables, owners, routes...'
                }
                className="w-full pl-8 pr-3 py-1.5 bg-space-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-colors font-sans"
              />
            </div>

            {/* List Body */}
            {activeTab === 'ports' ? (
              <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-1">
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
            ) : (
              <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-1">
                {filteredCables.map((cable) => {
                  const p = cable.properties;
                  const isSelected = selectedCable?.id === cable.id;
                  return (
                    <div
                      key={cable.id}
                      onClick={() => handleFlyToCable(cable)}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-sky-950/50 border-sky-400/80 text-sky-100 shadow-lg'
                          : 'bg-space-900/60 border-slate-800/80 hover:bg-space-850 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs font-sans text-slate-100">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="truncate">{p.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                          <span className="text-sky-300">{p.length_km?.toLocaleString()} km</span>
                          <span>•</span>
                          <span className="text-amber-400">{p.capacity_tbps} Tbps</span>
                          <span>•</span>
                          <span>RFS {p.rfs_year}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-space-950 border border-slate-700 text-sky-300">
                          {p.landing_points_count} Landing Stns
                        </span>
                        <span className="text-[9px] text-sky-400 font-mono flex items-center gap-0.5">
                          <Navigation className="w-2.5 h-2.5" /> Route
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Resizing Edge and Corner Grips */}
        {!isMinimized && (
          <ResizeHandles
            onStartResize={startResize}
            onReset={resetSize}
            containerRef={panelRef}
            directions={['se', 'sw', 's', 'e', 'w']}
          />
        )}
      </div>
    </motion.div>
  );
};
