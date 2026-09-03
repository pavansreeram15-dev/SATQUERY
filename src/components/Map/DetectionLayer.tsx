import React from 'react';
import { Polygon, Popup } from 'react-leaflet';
import { useMapContext } from '../../context/MapContext';
import { Ship, Box, Layers, Compass, Clock, CheckCircle2, Shield } from 'lucide-react';

export const DetectionLayer: React.FC = () => {
  const { queryResult, layers, selectedFeature, setSelectedFeature } = useMapContext();

  if (!layers?.detections || !queryResult) return null;
  if (
    queryResult.intent !== 'OBJECT_DETECTION' &&
    queryResult.intent !== 'OBJECT_COUNT' &&
    queryResult.intent !== 'SEGMENT_TERRAIN'
  ) {
    return null;
  }

  const features = queryResult.geojson_data?.features || [];
  if (features.length === 0) return null;

  return (
    <>
      {features.map((feature, idx) => {
        if (!feature?.geometry || feature.geometry.type !== 'Polygon') return null;

        const rawCoords = feature.geometry.coordinates?.[0];
        if (!rawCoords || rawCoords.length < 3) return null;

        // Leaflet expects [lat, lon] tuples
        const coords = rawCoords.map(
          (pt: [number, number]) => [pt[1], pt[0]] as [number, number]
        );

        const props = feature.properties || {};
        const isSelected = selectedFeature?.id === feature.id;
        const confidence = typeof props.confidence === 'number'
          ? (props.confidence * 100).toFixed(1)
          : '90.0';

        const lat = typeof props.latitude === 'number' ? props.latitude : coords[0][0];
        const lon = typeof props.longitude === 'number' ? props.longitude : coords[0][1];

        return (
          <Polygon
            key={feature.id || `det-${idx}`}
            positions={coords}
            pathOptions={{
              color: isSelected ? '#38BDF8' : '#06B6D4',
              weight: isSelected ? 3 : 2,
              fillColor: isSelected ? '#0284C7' : '#0891B2',
              fillOpacity: isSelected ? 0.45 : 0.22,
              dashArray: '4, 4',
            }}
            eventHandlers={{
              click: () => {
                if (setSelectedFeature) setSelectedFeature(feature);
              },
            }}
          >
            <Popup className="satquery-custom-popup">
              <div className="p-3 font-mono text-xs text-slate-100 bg-space-950 rounded-xl border border-cyan-500/50 shadow-2xl min-w-[220px] max-w-xs">
                {/* Header */}
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                    <Ship className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[11px] uppercase tracking-wide">
                      {props.label || 'Target Object'}
                    </span>
                  </div>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                      props.confidence >= 0.85
                        ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                        : 'bg-amber-950/80 border border-amber-500/60 text-amber-300'
                    }`}
                  >
                    {props.confidence_tier || (props.confidence >= 0.85 ? 'HIGH' : 'MODERATE')}
                  </span>
                </div>

                {/* Quantitative Data */}
                <div className="pt-2 space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Classification:</span>
                    <span className="font-semibold text-slate-200">
                      {props.class_category || 'Maritime Vessel'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Confidence:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {props.confidence_percent || `${confidence}%`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Compass className="w-3 h-3 text-cyan-400" /> Coordinates:
                    </span>
                    <span className="font-mono text-slate-300">
                      {lat.toFixed(4)}°, {lon.toFixed(4)}°
                    </span>
                  </div>

                  {props.length_m && props.width_m && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Dimensions:</span>
                      <span className="font-mono text-slate-300">
                        {props.length_m}m &times; {props.width_m}m
                      </span>
                    </div>
                  )}

                  {props.area_sq_m && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Footprint:</span>
                      <span className="font-mono text-slate-300">
                        {Number(props.area_sq_m).toLocaleString()} m²
                      </span>
                    </div>
                  )}

                  {props.heading_deg !== undefined && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Heading:</span>
                      <span className="font-mono text-slate-300">{props.heading_deg}°</span>
                    </div>
                  )}
                </div>

                {/* Footer Attribution */}
                <div className="mt-2.5 pt-1.5 border-t border-slate-800 text-[9px] text-slate-500 flex items-center justify-between">
                  <span>{queryResult.data_source || 'Sentinel-2 L2A MSI'}</span>
                  <span className="text-cyan-400 font-bold">EPSG:4326</span>
                </div>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
};
