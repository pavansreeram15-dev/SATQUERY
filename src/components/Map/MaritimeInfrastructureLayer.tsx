import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useMapContext } from '../../context/MapContext';
import { maritimeApi, GLOBAL_MARITIME_PORTS } from '../../services/maritimeApi';
import { MaritimePort } from '../../types/maritime';
import {
  Anchor,
  Ship,
  Navigation,
  Satellite,
  Compass,
  Layers,
  ExternalLink,
  Shield,
  Clock,
} from 'lucide-react';

const portIconCache = new Map<string, L.DivIcon>();

const getCachedPortIcon = (category: string, isSelected: boolean): L.DivIcon => {
  const cacheKey = `${category}_${isSelected ? '1' : '0'}`;
  const cached = portIconCache.get(cacheKey);
  if (cached) return cached;

  let bgGradient = 'from-cyan-500 to-blue-700';
  let borderColor = '#06B6D4';
  let symbol = '⚓';

  if (category === 'Deepwater Port') {
    bgGradient = 'from-blue-600 to-indigo-800';
    borderColor = '#3B82F6';
    symbol = '⚓';
  } else if (category === 'Container Terminal') {
    bgGradient = 'from-cyan-500 to-teal-700';
    borderColor = '#14B8A6';
    symbol = '🚢';
  } else if (category === 'Oil & LNG Jetty') {
    bgGradient = 'from-amber-500 to-orange-700';
    borderColor = '#F59E0B';
    symbol = '🛢️';
  } else if (category === 'Canal Transit Gateway') {
    bgGradient = 'from-emerald-500 to-teal-800';
    borderColor = '#10B981';
    symbol = '🌊';
  } else if (category === 'Naval Dockyard') {
    bgGradient = 'from-rose-600 to-red-900';
    borderColor = '#EF4444';
    symbol = '🛡️';
  }

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-150 ${
      isSelected ? 'scale-125 z-50' : 'hover:scale-110'
    }">
      <div class="w-7 h-7 rounded-full bg-gradient-to-br ${bgGradient} border-2 shadow-xl flex items-center justify-center text-xs text-white font-bold" style="border-color: ${
    isSelected ? '#38BDF8' : borderColor
  };">
        <span style="font-size: 11px; line-height: 1;">${symbol}</span>
      </div>
    </div>
  `;

  const newIcon = L.divIcon({
    html,
    className: 'satquery-port-div-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

  portIconCache.set(cacheKey, newIcon);
  return newIcon;
};

export const MaritimeInfrastructureLayer: React.FC = () => {
  const map = useMap();
  const {
    layers,
    setViewportBBox,
    setDrawnBBox,
    setQueryResult,
  } = useMapContext();

  const [ports, setPorts] = useState<MaritimePort[]>(GLOBAL_MARITIME_PORTS);
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    maritimeApi.getPorts().then((res) => {
      if (isMounted && res?.features?.length > 0) {
        setPorts(res.features.map((f) => f.properties));
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleInspectWithSatellite = useCallback(
    (port: MaritimePort) => {
      setSelectedPortId(port.id);
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

  if (!layers?.maritimeInfrastructure) return null;

  return (
    <>
      {ports.map((port) => {
        const coords: [number, number] = [port.latitude, port.longitude];
        const isSelected = selectedPortId === port.id;
        const icon = getCachedPortIcon(port.category, isSelected);

        return (
          <Marker
            key={port.id}
            position={coords}
            icon={icon}
            eventHandlers={{
              click: () => setSelectedPortId(port.id),
            }}
          >
            <Popup className="satquery-custom-popup">
              <div className="p-3 font-mono text-xs text-slate-100 bg-space-950 rounded-xl border border-cyan-500/50 shadow-2xl min-w-[260px] max-w-xs">
                {/* Header */}
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                    <Anchor className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="uppercase text-[10px] tracking-wide">{port.category}</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950/80 border border-emerald-500/60 text-emerald-300">
                    {port.status}
                  </span>
                </div>

                {/* Port Name & UN/LOCODE */}
                <div className="pt-2 font-sans font-bold text-xs text-slate-100 leading-snug">
                  {port.name}
                </div>

                {/* Location */}
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Compass className="w-3 h-3 text-cyan-400" />
                  <span>
                    {port.latitude.toFixed(3)}°, {port.longitude.toFixed(3)}°
                  </span>
                  <span>• UN/LOCODE: <strong className="text-cyan-300">{port.code}</strong></span>
                </div>

                {/* Port Telemetry Specs */}
                <div className="mt-2 p-2 rounded-lg bg-space-900/80 border border-slate-800 space-y-1 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Annual Throughput:</span>
                    <span className="font-bold text-amber-300 font-mono">{port.annual_traffic_teu}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Active Berths:</span>
                    <span className="font-bold text-slate-200 font-mono">{port.berth_count}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">AIS Vessels in Range:</span>
                    <span className="font-bold text-cyan-300 font-mono">{port.ais_vessels_detected}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-1.5 text-[10px] text-slate-400 line-clamp-2">
                  {port.description}
                </p>

                {/* Actions */}
                <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center gap-1.5">
                  <button
                    onClick={() => handleInspectWithSatellite(port)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-[10px] transition-all shadow-md cursor-pointer"
                  >
                    <Satellite className="w-3.5 h-3.5" />
                    <span>Inspect Port with Satellite</span>
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};
