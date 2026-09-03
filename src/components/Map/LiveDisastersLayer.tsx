import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useMapContext } from '../../context/MapContext';
import { disasterService } from '../../services/disasterService';
import { EarthEvent, DisasterGeoJSONFeature } from '../../types/disaster';

// Distinct Glowing Colors and Symbols for each Hazard Type
const HAZARD_CONFIG: Record<
  string,
  { symbol: string; color: string; bgGradient: string; glow: string; label: string }
> = {
  earthquake: {
    symbol: '🔴',
    color: '#EF4444',
    bgGradient: 'from-red-600 via-rose-700 to-space-950',
    glow: 'rgba(239, 68, 68, 0.65)',
    label: 'EARTHQUAKE',
  },
  wildfire: {
    symbol: '🔥',
    color: '#F97316',
    bgGradient: 'from-orange-500 via-red-600 to-amber-700',
    glow: 'rgba(249, 115, 22, 0.65)',
    label: 'WILDFIRE',
  },
  cyclone: {
    symbol: '🌀',
    color: '#06B6D4',
    bgGradient: 'from-cyan-500 via-blue-600 to-indigo-800',
    glow: 'rgba(6, 182, 212, 0.65)',
    label: 'CYCLONE',
  },
  storm: {
    symbol: '🌀',
    color: '#06B6D4',
    bgGradient: 'from-cyan-500 via-blue-600 to-indigo-800',
    glow: 'rgba(6, 182, 212, 0.65)',
    label: 'STORM',
  },
  flood: {
    symbol: '🌊',
    color: '#3B82F6',
    bgGradient: 'from-blue-500 via-indigo-600 to-sky-800',
    glow: 'rgba(59, 130, 246, 0.65)',
    label: 'FLOOD',
  },
  tsunami: {
    symbol: '🌊',
    color: '#3B82F6',
    bgGradient: 'from-blue-600 via-cyan-600 to-indigo-900',
    glow: 'rgba(59, 130, 246, 0.65)',
    label: 'TSUNAMI',
  },
  volcano: {
    symbol: '🌋',
    color: '#DC2626',
    bgGradient: 'from-red-700 via-rose-800 to-stone-900',
    glow: 'rgba(220, 38, 38, 0.65)',
    label: 'VOLCANO',
  },
  drought: {
    symbol: '☀️',
    color: '#D97706',
    bgGradient: 'from-amber-500 via-yellow-600 to-amber-800',
    glow: 'rgba(217, 119, 6, 0.65)',
    label: 'DROUGHT',
  },
  other: {
    symbol: '⚠️',
    color: '#EAB308',
    bgGradient: 'from-yellow-500 to-amber-700',
    glow: 'rgba(234, 179, 8, 0.65)',
    label: 'HAZARD',
  },
};

// Global DivIcon Cache to avoid DOM re-creation
const symbolIconCache = new Map<string, L.DivIcon>();

const getDisasterSymbolIcon = (
  type: string = 'other',
  severity: string = 'moderate',
  magnitude: number | string | undefined,
  isSelected: boolean
): L.DivIcon => {
  const normType = type.toLowerCase();
  const cfg = HAZARD_CONFIG[normType] || HAZARD_CONFIG.other;
  const magStr = magnitude && normType === 'earthquake' ? String(Number(magnitude).toFixed(1)) : '0';
  const cacheKey = `${normType}_${severity}_${magStr}_${isSelected ? '1' : '0'}`;

  const cached = symbolIconCache.get(cacheKey);
  if (cached) return cached;

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-150 ${
      isSelected ? 'scale-125 z-50' : 'hover:scale-115'
    }">
      <div class="w-7 h-7 rounded-full bg-gradient-to-br ${cfg.bgGradient} border-2 shadow-xl flex items-center justify-center text-xs text-white font-bold select-none" style="border-color: ${
    isSelected ? '#38BDF8' : cfg.color
  }; box-shadow: 0 0 12px ${cfg.glow};">
        <span style="font-size: 13px; line-height: 1; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.8));">${cfg.symbol}</span>
      </div>
      ${
        magnitude && normType === 'earthquake'
          ? `<div class="absolute -bottom-2 px-1 rounded bg-space-950/95 border border-slate-700 text-[8px] font-mono text-amber-300 font-bold leading-tight shadow-md">M${Number(
              magnitude
            ).toFixed(1)}</div>`
          : ''
      }
    </div>
  `;

  const newIcon = L.divIcon({
    html,
    className: 'satquery-disaster-symbol-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

  symbolIconCache.set(cacheKey, newIcon);
  return newIcon;
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

  // 1. Initial Data Fetch & Periodic Polling
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
        const matchesDesc = (p.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCountry && !matchesRegion && !matchesDesc) continue;
      }

      matched.push(feat);
    }

    return matched;
  }, [features, selectedTypes, selectedSeverities, filters.searchQuery, filters.selectedSource, layers?.liveDisasters]);

  // 3. Helper to format EarthEvent with complete description & telemetry
  const buildEventObject = useCallback((p: DisasterGeoJSONFeature['properties'], lat: number, lon: number): EarthEvent => {
    return {
      id: p.id,
      source: p.source || 'USGS',
      sources: p.sources || [p.source || 'USGS'],
      type: p.type || 'other',
      title: p.title || 'Earth Observation Hazard',
      description: p.description || 'Active natural hazard monitored via orbital satellites and ground telemetry.',
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

  // 4. Render Symbol Markers onto Leaflet Map
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

    filteredFeatures.forEach((feat) => {
      const p = feat.properties;
      const lat = typeof p.latitude === 'number' ? p.latitude : feat.geometry?.coordinates?.[1];
      const lon = typeof p.longitude === 'number' ? p.longitude : feat.geometry?.coordinates?.[0];
      if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) return;

      const eventObj = buildEventObject(p, lat, lon);
      const cfg = HAZARD_CONFIG[p.type] || HAZARD_CONFIG.other;
      const isSelected = selectedDisaster?.id === p.id;
      const icon = getDisasterSymbolIcon(p.type, p.severity, p.magnitude, isSelected);

      // Create Leaflet Marker with Symbol DivIcon
      const marker = L.marker([lat, lon], {
        icon,
        zIndexOffset: isSelected ? 1000 : 100,
      });

      // Quick hover tooltip
      marker.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px; font-weight: bold; color: #f8fafc;">
          ${cfg.symbol} ${p.title || 'Disaster Event'}
        </div>`,
        { direction: 'top', offset: [0, -10], className: 'satquery-map-tooltip' }
      );

      // Rich detailed popup with complete description
      const popupHtml = `
        <div style="font-family: monospace; font-size: 11px; color: #f8fafc; background: #020617; padding: 12px; border-radius: 12px; border: 1px solid rgba(6, 182, 212, 0.5); box-shadow: 0 10px 25px rgba(0,0,0,0.8); min-width: 260px; max-width: 320px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 6px; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 6px; font-weight: bold; color: ${cfg.color};">
              <span style="font-size: 14px;">${cfg.symbol}</span>
              <span style="text-transform: uppercase; font-size: 10px;">${cfg.label} INTELLIGENCE</span>
            </div>
            <span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase; background: #0f172a; border: 1px solid #334155; color: ${cfg.color};">
              ${p.severity || 'MODERATE'}
            </span>
          </div>

          <div style="font-family: sans-serif; font-weight: bold; font-size: 12px; line-height: 1.3; color: #f1f5f9; margin-bottom: 6px;">
            ${p.title || 'Earth Observation Event'}
          </div>

          <div style="font-size: 10px; color: #94a3b8; display: flex; align-items: center; gap: 4px; margin-bottom: 8px;">
            <span>📍 ${lat.toFixed(3)}°, ${lon.toFixed(3)}°</span>
            ${p.country ? `<span>• ${p.country}</span>` : ''}
            ${p.region ? `<span>(${p.region})</span>` : ''}
          </div>

          ${
            p.description
              ? `<div style="font-family: sans-serif; font-size: 11px; color: #cbd5e1; line-height: 1.4; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; border-radius: 8px; padding: 8px; margin-bottom: 8px;">
                  ${p.description}
                </div>`
              : ''
          }

          <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 8px; margin-bottom: 8px;">
            ${
              p.magnitude !== undefined && p.magnitude !== null
                ? `<div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span style="color: #64748b;">${p.type === 'earthquake' ? 'Magnitude' : p.type === 'flood' ? 'Rainfall (24h)' : p.type === 'wildfire' ? 'Radiative Power' : 'Intensity'}:</span>
                    <strong style="color: #f59e0b;">${p.type === 'earthquake' ? `M${Number(p.magnitude).toFixed(1)}` : `${p.magnitude} ${p.type === 'flood' ? 'mm' : p.type === 'wildfire' ? 'MW' : ''}`}</strong>
                  </div>`
                : ''
            }
            ${
              p.depth_km !== undefined && p.depth_km !== null
                ? `<div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span style="color: #64748b;">Hypocenter Depth:</span>
                    <strong style="color: #cbd5e1;">${Number(p.depth_km).toFixed(1)} km</strong>
                  </div>`
                : ''
            }
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Reporting Sources:</span>
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

      marker.bindPopup(popupHtml, { className: 'satquery-custom-popup', maxWidth: 340 });

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
