import React, { useEffect, useState, useMemo } from 'react';
import { Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useMapContext } from '../../context/MapContext';
import { cableApi, GLOBAL_SUBMARINE_CABLES_FALLBACK, GLOBAL_LANDING_POINTS_FALLBACK } from '../../services/cableApi';
import { SubmarineCableFeature, LandingPointFeature } from '../../types/cable';
import { Radio, Globe, Zap, Network, Shield, ExternalLink } from 'lucide-react';

export const SubmarineCablesLayer: React.FC = () => {
  const map = useMap();
  const { layers } = useMapContext();

  const [cables, setCables] = useState<SubmarineCableFeature[]>(GLOBAL_SUBMARINE_CABLES_FALLBACK);
  const [landingPoints, setLandingPoints] = useState<LandingPointFeature[]>(GLOBAL_LANDING_POINTS_FALLBACK);
  const [hoveredCableId, setHoveredCableId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([cableApi.getCables(), cableApi.getLandingPoints()]).then(
      ([cablesRes, lpRes]) => {
        if (isMounted) {
          if (cablesRes?.features?.length > 0) setCables(cablesRes.features);
          if (lpRes?.features?.length > 0) setLandingPoints(lpRes.features);
        }
      }
    );
    return () => {
      isMounted = false;
    };
  }, []);

  if (!layers?.submarineCables) return null;

  return (
    <>
      {/* Submarine Fiber Optic Cable Polylines */}
      {cables.map((cable) => {
        const coords = cable.geometry?.coordinates;
        if (!coords || coords.length < 2) return null;

        // Convert [lon, lat] to Leaflet [lat, lon]
        const latLngs: [number, number][] = (coords as number[][]).map(([lon, lat]) => [lat, lon]);
        const p = cable.properties;
        const isHovered = hoveredCableId === cable.id;

        return (
          <React.Fragment key={cable.id}>
            {/* Outer Glow Effect */}
            <Polyline
              positions={latLngs}
              pathOptions={{
                color: p.color || '#06B6D4',
                weight: isHovered ? 6 : 3.5,
                opacity: isHovered ? 0.9 : 0.65,
                lineCap: 'round',
                lineJoin: 'round',
              }}
              eventHandlers={{
                mouseover: () => setHoveredCableId(cable.id),
                mouseout: () => setHoveredCableId(null),
              }}
            >
              <Popup className="satquery-custom-popup">
                <div className="p-3 font-mono text-xs text-slate-100 bg-space-950 rounded-xl border border-cyan-500/50 shadow-2xl min-w-[260px] max-w-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                      <Network className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="uppercase text-[10px]">SUBMARINE CABLE</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-950 border border-cyan-500/60 text-cyan-300 font-mono">
                      GIGAWATT MAP
                    </span>
                  </div>

                  <div className="pt-2 font-sans font-bold text-xs text-slate-100 leading-snug">
                    {p.name}
                  </div>

                  <div className="mt-2 p-2 rounded-lg bg-space-900/80 border border-slate-800 space-y-1 text-[11px]">
                    {p.length_km && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Total Route Length:</span>
                        <span className="font-bold text-cyan-300 font-mono">
                          {p.length_km.toLocaleString()} km
                        </span>
                      </div>
                    )}
                    {p.capacity_tbps && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Design Capacity:</span>
                        <span className="font-bold text-amber-300 font-mono">
                          {p.capacity_tbps} Tbps
                        </span>
                      </div>
                    )}
                    {p.rfs_year && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Ready for Service:</span>
                        <span className="font-bold text-slate-200 font-mono">
                          Year {p.rfs_year}
                        </span>
                      </div>
                    )}
                  </div>

                  {p.owners && p.owners.length > 0 && (
                    <div className="mt-2 text-[10px]">
                      <span className="text-slate-500">Major Owners & Consortium:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.owners.map((owner) => (
                          <span
                            key={owner}
                            className="px-1.5 py-0.5 rounded bg-space-850 border border-slate-700 text-slate-300 text-[9px]"
                          >
                            {owner}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Polyline>
          </React.Fragment>
        );
      })}

      {/* Coastal Landing Point Terminal Markers */}
      {landingPoints.map((lp) => {
        const coords: [number, number] = [lp.properties.latitude, lp.properties.longitude];
        const p = lp.properties;

        return (
          <CircleMarker
            key={lp.id}
            center={coords}
            radius={5}
            pathOptions={{
              color: '#38BDF8',
              fillColor: '#0369A1',
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup className="satquery-custom-popup">
              <div className="p-2.5 font-mono text-xs text-slate-100 bg-space-950 rounded-xl border border-sky-500/50 shadow-2xl min-w-[220px]">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <div className="flex items-center gap-1 font-bold text-sky-300 text-[10px]">
                    <Globe className="w-3 h-3 text-sky-400" />
                    <span>LANDING STATION</span>
                  </div>
                  <span className="text-[9px] text-slate-400">{p.country}</span>
                </div>

                <div className="pt-1.5 font-sans font-bold text-xs text-slate-100">
                  {p.name}
                </div>

                <div className="mt-2 text-[10px] text-slate-400">
                  <span>Terminating Submarine Systems ({p.cables_count}):</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(p.cable_names || []).map((cName) => (
                      <span
                        key={cName}
                        className="px-1 py-0.2 rounded bg-sky-950 border border-sky-600/40 text-sky-200 text-[9px]"
                      >
                        {cName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
};
