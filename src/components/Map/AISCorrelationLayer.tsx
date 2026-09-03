import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { AISCorrelationMatch } from '../../types/ais';

interface AISCorrelationLayerProps {
  map: L.Map | null;
  correlations: AISCorrelationMatch[];
  enabled: boolean;
}

export const AISCorrelationLayer: React.FC<AISCorrelationLayerProps> = ({
  map,
  correlations,
  enabled,
}) => {
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;
    const group = L.layerGroup().addTo(map);
    layerGroupRef.current = group;

    return () => {
      group.clearLayers();
      map.removeLayer(group);
    };
  }, [map]);

  useEffect(() => {
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (!enabled || !correlations || correlations.length === 0) return;

    correlations.forEach((corr) => {
      const satCoords = corr.satellite_detection?.coordinates;
      if (!satCoords || satCoords.length < 2) return;

      const satLatLng: [number, number] = [satCoords[0], satCoords[1]];

      if (corr.matched && corr.matched_vessel) {
        const aisLatLng: [number, number] = [corr.matched_vessel.latitude, corr.matched_vessel.longitude];

        // Draw correlation polyline between satellite detection & AIS vessel
        const polyline = L.polyline([satLatLng, aisLatLng], {
          color: '#10b981', // Emerald green
          weight: 2,
          dashArray: '4, 4',
          opacity: 0.8,
        });

        const popupContent = `
          <div style="font-family: monospace; font-size: 11px; color: #f8fafc; background: #0f172a; p-2.5; border-radius: 8px; border: 1px solid #10b981;">
            <div style="font-weight: bold; color: #34d399; font-size: 12px; margin-bottom: 4px;">
              🔗 ${corr.status_label}
            </div>
            <div>Matched Vessel: <strong>${corr.matched_vessel.name}</strong> (MMSI: ${corr.matched_vessel.mmsi})</div>
            <div>Distance: <strong>${corr.distance_km} km</strong></div>
            <div style="color: #94a3b8; font-size: 10px; margin-top: 4px;">${corr.explanation}</div>
          </div>
        `;

        polyline.bindPopup(popupContent);
        polyline.addTo(group);
      } else {
        // Draw unmatched satellite detection marker
        const circle = L.circleMarker(satLatLng, {
          radius: 8,
          color: '#f59e0b', // Amber
          fillColor: '#f59e0b',
          fillOpacity: 0.3,
          weight: 2,
        });

        const popupContent = `
          <div style="font-family: monospace; font-size: 11px; color: #f8fafc; background: #0f172a; p-2.5; border-radius: 8px; border: 1px solid #f59e0b;">
            <div style="font-weight: bold; color: #fbbf24; font-size: 12px; margin-bottom: 4px;">
              ⚠️ ${corr.status_label}
            </div>
            <div>Satellite SAR ship object detected with no broadcast AIS telemetry within 3.0 km.</div>
          </div>
        `;

        circle.bindPopup(popupContent);
        circle.addTo(group);
      }
    });
  }, [map, correlations, enabled]);

  return null;
};
