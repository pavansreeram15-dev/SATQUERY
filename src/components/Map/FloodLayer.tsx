import React from 'react';
import { Polygon, Popup } from 'react-leaflet';
import { useMapContext } from '../../context/MapContext';
import { ShieldAlert, Droplets, Info, AlertTriangle } from 'lucide-react';

export const FloodLayer: React.FC = () => {
  const { queryResult, layers } = useMapContext();

  if (!layers.flood || !queryResult) return null;
  if (queryResult.intent !== 'FLOOD_DETECTION' && queryResult.intent !== 'NDWI_ANALYSIS') {
    return null;
  }

  const features = queryResult.geojson_data.features || [];

  return (
    <>
      {features.map((feature, idx) => {
        if (feature.geometry.type !== 'Polygon') return null;

        const coords = feature.geometry.coordinates[0].map(
          (pt: [number, number]) => [pt[1], pt[0]] as [number, number]
        );

        const props = feature.properties || {};
        const status = (props.status || queryResult.status || 'NORMAL').toUpperCase();
        const isCritical = status === 'CRITICAL' || props.risk_level === 'EMERGENCY_EVACUATION';
        const isWatch = status === 'WATCH' || status === 'HIGH_RISK';
        const isNormal = status === 'NORMAL' || status === 'ROUTINE_MONITORING' || (!isCritical && !isWatch);

        let strokeColor = '#3B82F6';
        let fillColor = '#2563EB';
        let title = props.inundation_type || props.zone || 'Permanent Water Body';
        let badgeColor = 'bg-blue-950/80 border-blue-500/50 text-blue-300';

        if (isCritical) {
          strokeColor = '#EF4444';
          fillColor = '#DC2626';
          title = 'CRITICAL FLOOD INUNDATION';
          badgeColor = 'bg-rose-950/80 border-rose-500/50 text-rose-300';
        } else if (isWatch) {
          strokeColor = '#F59E0B';
          fillColor = '#D97706';
          title = props.inundation_type || 'MONITORED WATER EXTENT';
          badgeColor = 'bg-amber-950/80 border-amber-500/50 text-amber-300';
        }

        return (
          <Polygon
            key={feature.id || idx}
            positions={coords}
            pathOptions={{
              color: strokeColor,
              weight: 2,
              fillColor,
              fillOpacity: isNormal ? 0.35 : 0.5,
            }}
          >
            <Popup className="satquery-custom-popup">
              <div className="p-3 font-mono text-xs text-slate-100 bg-space-950 rounded-xl border border-slate-700 shadow-2xl min-w-[260px]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    {isCritical ? (
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                    ) : isWatch ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Droplets className="w-4 h-4 text-blue-400" />
                    )}
                    <span className="text-[10px] uppercase truncate max-w-[170px]">{title}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${badgeColor}`}>
                    {props.status || status}
                  </span>
                </div>

                <div className="pt-2 space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Severity:</span>
                    <span className="font-bold text-slate-200 font-mono">
                      {props.severity || (isNormal ? 'NONE' : 'MODERATE')}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Depth / Profile:</span>
                    <span className="text-slate-200">{props.depth_category || props.depth || 'Normal Depth Extent'}</span>
                  </div>

                  {props.area_km2 !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Surface Extent:</span>
                      <span className="font-bold text-cyan-300">{props.area_km2} km²</span>
                    </div>
                  )}

                  {props.risk_level && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Protocol:</span>
                      <span className="text-slate-300 font-semibold">{props.risk_level}</span>
                    </div>
                  )}
                </div>

                <div className="mt-2.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between gap-3 font-mono">
                  <span className="truncate">Source: {queryResult.data_source}</span>
                  <span className="flex-shrink-0 text-cyan-400 font-semibold">Sensor: SAR C-Band</span>
                </div>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
};
