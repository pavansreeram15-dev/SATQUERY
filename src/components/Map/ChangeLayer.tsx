import React from 'react';
import { Polygon, Popup } from 'react-leaflet';
import { useMapContext } from '../../context/MapContext';
import { RefreshCw, TrendingUp } from 'lucide-react';

export const ChangeLayer: React.FC = () => {
  const { queryResult, layers } = useMapContext();

  if (!layers.change || !queryResult) return null;
  if (queryResult.intent !== 'CHANGE_DETECTION') return null;

  const features = queryResult.geojson_data.features || [];

  const getChangeStyle = (changeType: string) => {
    switch (changeType) {
      case 'New Construction':
        return { color: '#06B6D4', fillColor: '#0891B2', fillOpacity: 0.4 };
      case 'Vegetation Loss':
        return { color: '#EF4444', fillColor: '#DC2626', fillOpacity: 0.4 };
      case 'Vegetation Gain':
        return { color: '#10B981', fillColor: '#059669', fillOpacity: 0.4 };
      case 'Water Expansion':
        return { color: '#3B82F6', fillColor: '#2563EB', fillOpacity: 0.4 };
      default:
        return { color: '#F59E0B', fillColor: '#D97706', fillOpacity: 0.4 };
    }
  };

  return (
    <>
      {features.map((feature, idx) => {
        if (feature.geometry.type !== 'Polygon') return null;

        const coords = feature.geometry.coordinates[0].map(
          (pt: [number, number]) => [pt[1], pt[0]] as [number, number]
        );

        const props = feature.properties || {};
        const style = getChangeStyle(props.change_type);

        return (
          <Polygon key={feature.id || idx} positions={coords} pathOptions={style}>
            <Popup className="satquery-custom-popup">
              <div className="p-2.5 font-mono text-xs text-slate-100 bg-space-950 rounded-lg border border-cyan-500/50 shadow-xl min-w-[210px]">
                <div className="flex items-center gap-1.5 font-bold text-cyan-300 pb-1 border-b border-slate-800">
                  <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                  <span>{props.change_type || 'Earth Surface Change'}</span>
                </div>

                <div className="pt-2 space-y-1 text-[11px] text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Time Interval:</span>
                    <span className="font-semibold text-amber-300">
                      {props.before_year || '2023'} &rarr; {props.after_year || '2025'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Area Modified:</span>
                    <span className="font-bold text-cyan-300">{props.area_km2 || '4.8'} km²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Confidence:</span>
                    <span className="font-bold text-emerald-400">
                      {props.confidence_percent || `${((props.confidence || 0.92) * 100).toFixed(1)}%`}
                    </span>
                  </div>
                  {props.intensity && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rate:</span>
                      <span className="text-slate-200">{props.intensity}</span>
                    </div>
                  )}
                </div>

                <div className="mt-2 pt-1 border-t border-slate-800 text-[9px] text-slate-500 flex justify-between">
                  <span>Source: {queryResult.data_source}</span>
                  <span>Method: SSIM Diff</span>
                </div>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
};
