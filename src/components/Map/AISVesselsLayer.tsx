import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { AISVessel } from '../../types/ais';

interface AISVesselsLayerProps {
  map: L.Map | null;
  vessels: AISVessel[];
  enabled: boolean;
  onSelectVessel?: (vessel: AISVessel) => void;
}

const shipTypeColors: Record<string, string> = {
  Cargo: '#06b6d4',      // Cyan
  Tanker: '#f59e0b',     // Amber
  Passenger: '#10b981',  // Emerald
  Fishing: '#8b5cf6',    // Violet
  Tug: '#ec4899',        // Pink
  Military: '#ef4444',   // Red
  Pleasure: '#3b82f6',   // Blue
  Other: '#64748b',      // Slate
};

const aisIconCache = new Map<string, L.DivIcon>();

const getCachedAISIcon = (shipType: string, rawHeading: number): L.DivIcon => {
  const color = shipTypeColors[shipType] || shipTypeColors.Other;
  // Quantize heading to 10-degree buckets to avoid creating endless unique DOM icon templates
  const headingBucket = Math.round((rawHeading % 360) / 10) * 10;
  const cacheKey = `${shipType}_${headingBucket}`;

  const cached = aisIconCache.get(cacheKey);
  if (cached) return cached;

  const iconHtml = `
    <div style="
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: rotate(${headingBucket}deg);
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="${color}" stroke="#0f172a" stroke-width="1.5">
        <path d="M12 2L4 20C4 20 8 18 12 18C16 18 20 20 20 20L12 2Z"/>
      </svg>
    </div>
  `;

  const newIcon = L.divIcon({
    html: iconHtml,
    className: 'ais-vessel-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  aisIconCache.set(cacheKey, newIcon);
  return newIcon;
};

export const AISVesselsLayer: React.FC<AISVesselsLayerProps> = ({
  map,
  vessels,
  enabled,
  onSelectVessel,
}) => {
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialize LayerGroup
  useEffect(() => {
    if (!map) return;
    const group = L.layerGroup().addTo(map);
    layerGroupRef.current = group;

    return () => {
      group.clearLayers();
      map.removeLayer(group);
      markersMapRef.current.clear();
    };
  }, [map]);

  // Update vessel markers with marker reuse
  useEffect(() => {
    const group = layerGroupRef.current;
    if (!map || !group) return;

    if (!enabled) {
      group.clearLayers();
      markersMapRef.current.clear();
      return;
    }

    const currentMmsis = new Set<string>();
    // Cap at top 60 vessels to keep map completely fluid
    const safeVessels = (vessels || []).slice(0, 60);

    safeVessels.forEach((vessel) => {
      currentMmsis.add(vessel.mmsi);
      const color = shipTypeColors[vessel.ship_type] || shipTypeColors.Other;
      const heading = vessel.heading || vessel.course || 0;
      const customIcon = getCachedAISIcon(vessel.ship_type, heading);

      const popupContent = `
        <div style="font-family: monospace; font-size: 11px; color: #f8fafc; background: #0f172a; padding: 10px; border-radius: 8px; border: 1px solid #334155; min-width: 220px;">
          <div style="font-weight: bold; color: ${color}; font-size: 12px; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
            <span>🚢 ${vessel.name}</span>
            <span style="font-size: 9px; padding: 2px 4px; background: #1e293b; border-radius: 4px; border: 1px solid #475569;">${vessel.ship_type}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; color: #cbd5e1;">
            <div><span style="color: #64748b;">MMSI:</span> ${vessel.mmsi}</div>
            <div><span style="color: #64748b;">IMO:</span> ${vessel.imo || 'N/A'}</div>
            <div><span style="color: #64748b;">Call Sign:</span> ${vessel.callsign || 'N/A'}</div>
            <div><span style="color: #64748b;">Speed:</span> ${vessel.speed_knots} kn</div>
            <div><span style="color: #64748b;">Course:</span> ${vessel.course}°</div>
            <div><span style="color: #64748b;">Heading:</span> ${vessel.heading}°</div>
          </div>
          <div style="margin-top: 6px; font-size: 10px; color: #94a3b8; border-top: 1px dashed #334155; padding-top: 4px;">
            <div><span style="color: #64748b;">Status:</span> ${vessel.navigation_status}</div>
            <div><span style="color: #64748b;">Destination:</span> ${vessel.destination || 'Unannounced'}</div>
            <div style="margin-top: 4px; color: #38bdf8; display: flex; justify-content: space-between;">
              <span>AIS Last Update: ${vessel.last_update_seconds_ago}s ago</span>
              <span style="color: #94a3b8;">Source: ${vessel.source}</span>
            </div>
          </div>
        </div>
      `;

      let marker = markersMapRef.current.get(vessel.mmsi);
      if (marker) {
        // Reuse marker: update position & icon & popup
        marker.setLatLng([vessel.latitude, vessel.longitude]);
        marker.setIcon(customIcon);
        marker.setPopupContent(popupContent);
      } else {
        // Create new marker
        marker = L.marker([vessel.latitude, vessel.longitude], { icon: customIcon });
        marker.bindPopup(popupContent, { className: 'ais-popup-container' });
        marker.on('click', () => {
          if (onSelectVessel) onSelectVessel(vessel);
        });
        marker.addTo(group);
        markersMapRef.current.set(vessel.mmsi, marker);
      }
    });

    // Remove markers that are no longer in active viewport
    markersMapRef.current.forEach((marker, mmsi) => {
      if (!currentMmsis.has(mmsi)) {
        group.removeLayer(marker);
        markersMapRef.current.delete(mmsi);
      }
    });
  }, [map, vessels, enabled, onSelectVessel]);

  return null;
};
