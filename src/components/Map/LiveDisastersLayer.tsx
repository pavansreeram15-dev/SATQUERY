import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useMapContext } from '../../context/MapContext';
import { disasterService } from '../../services/disasterService';
import { EarthEvent, DisasterGeoJSONFeature } from '../../types/disaster';

const HAZARD_COLORS: Record<string, string> = {
  earthquake: '#EF4444', // Red
  wildfire: '#F97316',   // Orange
  cyclone: '#06B6D4',    // Cyan
  storm: '#06B6D4',      // Cyan
  flood: '#3B82F6',      // Blue
  tsunami: '#3B82F6',    // Blue
  volcano: '#DC2626',    // Crimson
  drought: '#D97706',    // Amber
  other: '#EAB308',      // Yellow
};

const HAZARD_ICONS: Record<string, string> = {
  earthquake: '🔴',
  wildfire: '🔥',
  cyclone: '🌀',
  storm: '🌀',
  flood: '🌊',
  tsunami: '🌊',
  volcano: '🌋',
  drought: '☀️',
  other: '⚠️',
};

export const LiveDisastersLayer: React.FC = () => {
  const map = useMap();
  const {
    layers,
    selectedDisaster,
    setSelectedDisaster,
    disastersData,
    setDisastersData,
    disasterFilters,
    triggerSatelliteAnalysisForDisaster,
  } = useMapContext();

  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const canvasRendererRef = useRef<L.Canvas | null>(null);

  // Initialize canvas renderer safely
  if (!canvasRendererRef.current && typeof L !== 'undefined' && L.canvas) {
    canvasRendererRef.current = L.canvas({ padding: 0.5 });
  }

  // 1. Initial Data Fetch & Periodic Background Sync
  useEffect(() => {
    let isMounted = true;

    const loadDisasters = async () => {
      try {
        const data = await disasterService.getLiveDisasters(disasterFilters);
        if (isMounted && data && data.features && data.features.length > 0 && setDisastersData) {
          setDisastersData(data);
        }
      } catch (err) {
        console.warn('[LiveDisastersLayer] Disasters fetch warning:', err);
      }
    };

    loadDisasters();

    const pollInterval = setInterval(() => {
      if (isMounted && layers?.liveDisasters) {
        loadDisasters();
      }
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [disasterFilters?.timeRange, disasterFilters?.selectedSource, setDisastersData, layers?.liveDisasters]);

  // 2. Filter raw features based on active user filters
  const features = disastersData?.features || [];
  const filters = disasterFilters || {
    timeRange: '24h',
    selectedTypes: [],
    selectedSeverities: [],
    selectedSource: 'ALL',
    searchQuery: '',
  };

  const selectedTypes = filters.selectedTypes || [];
  const selectedSeverities = filters.selectedSeverities || [];

  const filteredFeatures = useMemo(() => {
    if (!layers?.liveDisasters || !features || features.length === 0) {
      return [];
    }

    const matched: DisasterGeoJSONFeature[] = [];

    for (let i = 0; i < features.length; i++) {
      const feat = features[i];
      if (!feat || !feat.properties) continue;
      const p = feat.properties;

      // Coordinate validation
      const lat = typeof p.latitude === 'number' ? p.latitude : (feat.geometry?.coordinates?.[1] ?? null);
      const lon = typeof p.longitude === 'number' ? p.longitude : (feat.geometry?.coordinates?.[0] ?? null);
      if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) continue;

      // 1. Data Source Filter
      if (filters.selectedSource && filters.selectedSource !== 'ALL') {
        const sources = p.sources || (p.source ? [p.source] : []);
        if (!sources.some((s: string) => s.toUpperCase() === filters.selectedSource.toUpperCase())) {
          continue;
        }
      }

      // 2. Hazard Category Filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(p.type)) {
        continue;
      }

      // 3. Severity Filter
      if (selectedSeverities.length > 0 && !selectedSeverities.includes(p.severity)) {
        continue;
      }

      // 4. Text Search Filter
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = (p.title || '').toLowerCase().includes(q);
        const matchesCountry = (p.country || '').toLowerCase().includes(q);
        const matchesRegion = (p.region || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCountry && !matchesRegion) continue;
      }

      matched.push(feat);
    }

    return matched;
  }, [features, selectedTypes, selectedSeverities, filters.searchQuery, filters.selectedSource, layers?.liveDisasters]);

  // 3. Helper to format EarthEvent
  const buildEventObject = useCallback((p: DisasterGeoJSONFeature['properties'], lat: number, lon: number): EarthEvent => {
    return {
      id: p.id,
      source: p.source || 'USGS',
      sources: p.sources || [p.source || 'USGS'],
      type: p.type || 'other',
      title: p.title || 'Earth Event',
      description: p.description,
      latitude: lat,
      longitude: lon,
      magnitude: p.magnitude,
      depth_km: p.depth_km,
      severity: p.severity || 'moderate',
      alert_level: p.alert_level || 'green',
      confidence: p.confidence ?? 0.95,
      start_time: p.start_time,
      updated_time: p.updated_time,
      country: p.country,
      region: p.region,
      source_url: p.source_url,
    };
  }, []);

  // 4. Render HTML5 Canvas CircleMarkers with clean memory management
  useEffect(() => {
    if (!map) return;

    // Clean up previous layer group
    if (layerGroupRef.current) {
      layerGroupRef.current.clearLayers();
      if (map.hasLayer(layerGroupRef.current)) {
        map.removeLayer(layerGroupRef.current);
      }
      layerGroupRef.current = null;
    }

    if (!layers?.liveDisasters || filteredFeatures.length === 0) {
      return;
    }

    const layerGroup = L.layerGroup();
    const renderer = canvasRendererRef.current || L.canvas({ padding: 0.5 });

    filteredFeatures.forEach((feat) => {
      const p = feat.properties;
      const lat = typeof p.latitude === 'number' ? p.latitude : feat.geometry?.coordinates?.[1];
      const lon = typeof p.longitude === 'number' ? p.longitude : feat.geometry?.coordinates?.[0];
      if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) return;

      const eventObj = buildEventObject(p, lat, lon);
      const color = HAZARD_COLORS[p.type] || HAZARD_COLORS.other;
      const iconSymbol = HAZARD_ICONS[p.type] || '⚠️';
      const isSelected = selectedDisaster?.id === p.id;

      // Ultra-fast Hardware-Accelerated HTML5 Canvas CircleMarker
      const marker = L.circleMarker([lat, lon], {
        renderer,
        radius: isSelected ? 12 : 8,
        color: isSelected ? '#38bdf8' : '#ffffff',
        weight: isSelected ? 2.5 : 1.5,
        fillColor: color,
        fillOpacity: isSelected ? 1.0 : 0.85,
      });

      // Quick hover tooltip
      marker.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px; font-weight: bold; color: #f8fafc;">
          ${iconSymbol} ${p.title || 'Disaster Event'}
        </div>`,
        { direction: 'top', offset: [0, -6], className: 'satquery-map-tooltip' }
      );

      // Rich detailed popup
      const popupHtml = `
        <div style="font-family: monospace; font-size: 11px; color: #f8fafc; background: #020617; padding: 12px; border-radius: 12px; border: 1px solid rgba(6, 182, 212, 0.5); box-shadow: 0 10px 25px rgba(0,0,0,0.8); min-width: 250px; max-width: 300px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 6px; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 6px; font-weight: bold; color: ${color};">
              <span>${iconSymbol}</span>
              <span style="text-transform: uppercase; font-size: 10px;">${p.type || 'EARTH'} EVENT</span>
            </div>
            <span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase; background: #0f172a; border: 1px solid #334155; color: ${color};">
              ${p.severity || 'MODERATE'}
            </span>
          </div>

          <div style="font-family: sans-serif; font-weight: bold; font-size: 12px; line-height: 1.3; color: #f1f5f9; margin-bottom: 6px;">
            ${p.title || 'Earth Observation Event'}
          </div>

          <div style="font-size: 10px; color: #94a3b8; display: flex; align-items: center; gap: 4px; margin-bottom: 8px;">
            <span>📍 ${lat.toFixed(3)}°, ${lon.toFixed(3)}°</span>
            ${p.country ? `<span>• ${p.country}</span>` : ''}
          </div>

          <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 8px; margin-bottom: 8px;">
            ${
              p.magnitude !== undefined && p.magnitude !== null
                ? `<div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span style="color: #64748b;">${p.type === 'earthquake' ? 'Magnitude' : 'Intensity'}:</span>
                    <strong style="color: #f59e0b;">${p.type === 'earthquake' ? `M${Number(p.magnitude).toFixed(1)}` : p.magnitude}</strong>
                  </div>`
                : ''
            }
            ${
              p.depth_km !== undefined && p.depth_km !== null
                ? `<div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span style="color: #64748b;">Depth:</span>
                    <strong style="color: #cbd5e1;">${Number(p.depth_km).toFixed(1)} km</strong>
                  </div>`
                : ''
            }
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Sources:</span>
              <strong style="color: #38bdf8;">${(p.sources || [p.source || 'USGS']).join(', ')}</strong>
            </div>
          </div>

          <div style="display: flex; gap: 6px; border-top: 1px solid #1e293b; padding-top: 8px;">
            <button id="btn-sat-analyze-${p.id}" style="flex: 1; padding: 6px 10px; background: #0891b2; color: #000000; font-weight: bold; font-size: 10px; border-radius: 6px; border: none; cursor: pointer;">
              🛰️ Analyze Satellite
            </button>
            ${
              p.source_url
                ? `<a href="${p.source_url}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; padding: 6px 8px; background: #1e293b; color: #cbd5e1; border-radius: 6px; border: 1px solid #334155; text-decoration: none; font-size: 10px;">
                    ↗ Source
                  </a>`
                : ''
            }
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'satquery-custom-popup', maxWidth: 320 });

      // Handle popup interactions & satellite analysis trigger
      marker.on('popupopen', () => {
        const analyzeBtn = document.getElementById(`btn-sat-analyze-${p.id}`);
        if (analyzeBtn) {
          analyzeBtn.onclick = () => {
            if (triggerSatelliteAnalysisForDisaster) {
              triggerSatelliteAnalysisForDisaster(eventObj);
            }
            map.flyTo([lat, lon], 12, { duration: 1.2 });
          };
        }
      });

      marker.on('click', () => {
        if (setSelectedDisaster) {
          setSelectedDisaster(eventObj);
        }
      });

      layerGroup.addLayer(marker);
    });

    map.addLayer(layerGroup);
    layerGroupRef.current = layerGroup;

    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
        if (map.hasLayer(layerGroupRef.current)) {
          map.removeLayer(layerGroupRef.current);
        }
        layerGroupRef.current = null;
      }
    };
  }, [map, filteredFeatures, layers?.liveDisasters, selectedDisaster?.id, buildEventObject, setSelectedDisaster, triggerSatelliteAnalysisForDisaster]);

  return null;
};
