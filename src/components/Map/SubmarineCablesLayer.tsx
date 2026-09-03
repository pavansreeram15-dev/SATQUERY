import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { SubmarineCableFeature, LandingPointFeature, SubmarineCableDetail } from '../../types/cable';
import { cableApi } from '../../services/cableApi';

interface SubmarineCablesLayerProps {
  map: L.Map | null;
  cables: SubmarineCableFeature[];
  landingPoints: LandingPointFeature[];
  enabled: boolean;
}

const ATTRIBUTION_HTML = `
  <div style="margin-top: 6px; font-size: 9px; color: #64748b; border-top: 1px solid #334155; padding-top: 4px;">
    Data: <strong>Gigawatt Map / TeleGeography</strong> &mdash; CC BY-NC-SA 3.0, non-commercial use
  </div>
`;

export const SubmarineCablesLayer: React.FC<SubmarineCablesLayerProps> = ({
  map,
  cables,
  landingPoints,
  enabled,
}) => {
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize LayerGroup
  useEffect(() => {
    if (!map) return;
    const group = L.layerGroup().addTo(map);
    layerGroupRef.current = group;

    return () => {
      group.clearLayers();
      map.removeLayer(group);
    };
  }, [map]);

  // Update cable vectors & landing point markers
  useEffect(() => {
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (!enabled) return;

    // 1. Render Submarine Cable GeoJSON Routes (LineStrings / MultiLineStrings)
    cables.forEach((feat) => {
      const props = feat.properties;
      const color = props.color || '#06b6d4';

      const geoLayer = L.geoJSON(feat as any, {
        style: {
          color: color,
          weight: 2.5,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        },
        onEachFeature: (feature, layer) => {
          const defaultPopup = `
            <div style="font-family: monospace; font-size: 11px; color: #f8fafc; background: #0f172a; padding: 10px; border-radius: 8px; border: 1px solid #06b6d4; min-width: 220px;">
              <div style="font-weight: bold; color: #38bdf8; font-size: 12px; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 6px;">
                🌐 Submarine Cable: ${props.name}
              </div>
              <div style="display: space-y-1; color: #cbd5e1;">
                <div><span style="color: #64748b;">Owners:</span> ${props.owners || 'TeleGeography Consortium / Telecom Operators'}</div>
                <div><span style="color: #64748b;">Length:</span> ${props.length || 'Transoceanic Route'}</div>
                <div><span style="color: #64748b;">Status / RFS:</span> ${props.rfs || props.rfs_year || 'Active Fiber Optic Route'}</div>
              </div>
              ${ATTRIBUTION_HTML}
            </div>
          `;
          layer.bindPopup(defaultPopup);

          // Lazy load deep details when clicked
          layer.on('click', async () => {
            try {
              const details = await cableApi.getCableDetail(props.id);
              if (details) {
                const lpNames = details.landing_points
                  ? details.landing_points.map((lp) => lp.name).slice(0, 5).join(', ')
                  : 'Global Landing Terminals';

                const richPopup = `
                  <div style="font-family: monospace; font-size: 11px; color: #f8fafc; background: #0f172a; padding: 10px; border-radius: 8px; border: 1px solid #06b6d4; min-width: 240px;">
                    <div style="font-weight: bold; color: #38bdf8; font-size: 12px; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 6px; display: flex; justify-content: space-between;">
                      <span>🌐 ${details.name}</span>
                      <span style="font-size: 9px; color: #34d399; background: #064e3b; padding: 2px 4px; border-radius: 4px;">${details.is_planned ? 'PLANNED' : 'ACTIVE'}</span>
                    </div>
                    <div style="space-y-1; color: #cbd5e1;">
                      <div><span style="color: #64748b;">Owners/Operators:</span> ${details.owners || 'Multi-operator Consortium'}</div>
                      <div><span style="color: #64748b;">Cable Length:</span> ${details.length || 'Transoceanic'}</div>
                      <div><span style="color: #64748b;">Ready For Service:</span> ${details.rfs || details.rfs_year || 'Operational'}</div>
                      <div><span style="color: #64748b;">Suppliers:</span> ${details.suppliers || 'Submarine Systems'}</div>
                      <div style="margin-top: 4px; color: #94a3b8; font-size: 10px;">
                        <span style="color: #64748b;">Landing Points:</span> ${lpNames}
                      </div>
                    </div>
                    ${ATTRIBUTION_HTML}
                  </div>
                `;
                layer.setPopupContent(richPopup);
              }
            } catch (err) {
              console.warn('[SubmarineCablesLayer] Cable detail load warning:', err);
            }
          });
        },
      });

      geoLayer.addTo(group);
    });

    // 2. Render Landing Point Markers (GeoJSON Points)
    landingPoints.forEach((lp) => {
      const props = lp.properties;
      const coords = lp.geometry.coordinates; // [lon, lat]

      if (coords && coords.length >= 2) {
        const marker = L.circleMarker([coords[1], coords[0]], {
          radius: 4,
          color: '#38bdf8', // Cyan border
          fillColor: '#0284c7', // Sky blue fill
          fillOpacity: 0.9,
          weight: 1.5,
        });

        const popupContent = `
          <div style="font-family: monospace; font-size: 11px; color: #f8fafc; background: #0f172a; padding: 8px; border-radius: 8px; border: 1px solid #38bdf8; min-width: 180px;">
            <div style="font-weight: bold; color: #38bdf8; font-size: 11px; margin-bottom: 4px;">
              ⚓ Submarine Landing Terminal
            </div>
            <div><span style="color: #64748b;">Name:</span> ${props.name}</div>
            ${props.country ? `<div><span style="color: #64748b;">Country:</span> ${props.country}</div>` : ''}
            ${ATTRIBUTION_HTML}
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(group);
      }
    });
  }, [map, cables, landingPoints, enabled]);

  return null;
};
