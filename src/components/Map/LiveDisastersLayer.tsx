import React, { useEffect, useState, useMemo } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useMapContext } from '../../context/MapContext';
import { disasterService } from '../../services/disasterService';
import { EarthEvent, DisasterGeoJSONFeature } from '../../types/disaster';
import {
  Activity,
  Flame,
  Wind,
  Droplets,
  Mountain,
  AlertTriangle,
  Radio,
  ExternalLink,
  Satellite,
  Compass,
  Clock,
  Layers,
  ArrowUpRight,
  SunMedium,
} from 'lucide-react';

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

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const loadDisasters = async () => {
      setLoading(true);
      try {
        const data = await disasterService.getLiveDisasters(disasterFilters);
        if (isMounted && data && setDisastersData) {
          setDisastersData(data);
        }
      } catch (err) {
        console.warn('[LiveDisastersLayer] Disasters fetch warning:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDisasters();

    const unsubscribe = disasterService.subscribeToLiveStream(
      (payload) => {
        if (isMounted && payload?.geojson && setDisastersData) {
          setDisastersData(payload.geojson);
        }
      },
      () => {}
    );

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [disasterFilters?.timeRange, disasterFilters?.selectedSource, setDisastersData]);

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

    const nowMs = Date.now();
    const cutoffMs =
      filters.timeRange === '1h'
        ? nowMs - 1 * 3600 * 1000
        : filters.timeRange === '24h'
        ? nowMs - 24 * 3600 * 1000
        : filters.timeRange === '7d'
        ? nowMs - 7 * 24 * 3600 * 1000
        : filters.timeRange === '30d'
        ? nowMs - 30 * 24 * 3600 * 1000
        : 0;

    return features.filter((feat) => {
      if (!feat || !feat.properties) return false;
      const p = feat.properties;

      // 1. Time Range Filter (Immediate Client-Side Enforcement)
      if (cutoffMs > 0 && p.start_time) {
        const eventTime = new Date(p.start_time).getTime();
        if (!isNaN(eventTime) && eventTime < cutoffMs) {
          return false;
        }
      }

      // 2. Data Source Filter
      if (filters.selectedSource && filters.selectedSource !== 'ALL') {
        const sources = p.sources || (p.source ? [p.source] : []);
        if (!sources.some((s: string) => s.toUpperCase() === filters.selectedSource.toUpperCase())) {
          return false;
        }
      }

      // 3. Hazard Category Filter (includes drought, earthquake, wildfire, cyclone, flood, volcano, etc.)
      if (selectedTypes.length > 0 && !selectedTypes.includes(p.type)) {
        return false;
      }

      // 4. Severity Filter
      if (selectedSeverities.length > 0 && !selectedSeverities.includes(p.severity)) {
        return false;
      }

      // 5. Text Search Filter
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = (p.title || '').toLowerCase().includes(q);
        const matchesCountry = (p.country || '').toLowerCase().includes(q);
        const matchesRegion = (p.region || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCountry && !matchesRegion) return false;
      }
      return true;
    });
  }, [features, selectedTypes, selectedSeverities, filters.searchQuery, filters.timeRange, filters.selectedSource, layers?.liveDisasters]);

  if (!layers?.liveDisasters || filteredFeatures.length === 0) return null;

  const getMarkerIcon = (props: DisasterGeoJSONFeature['properties']) => {
    const type = props?.type || 'other';
    const severity = props?.severity || 'moderate';
    const magnitude = props?.magnitude;

    let bgGradient = 'from-amber-500 to-orange-600';
    let borderColor = '#F59E0B';
    let pulseRing = 'rgba(245, 158, 11, 0.4)';
    let symbol = '⚠️';

    if (type === 'earthquake') {
      symbol = '🔴';
      if (severity === 'critical' || (magnitude && magnitude >= 7.0)) {
        bgGradient = 'from-red-600 to-rose-950';
        borderColor = '#EF4444';
        pulseRing = 'rgba(239, 68, 68, 0.7)';
      } else if (severity === 'severe' || (magnitude && magnitude >= 6.0)) {
        bgGradient = 'from-rose-500 to-red-700';
        borderColor = '#F43F5E';
        pulseRing = 'rgba(244, 63, 94, 0.5)';
      } else if (severity === 'major' || (magnitude && magnitude >= 4.5)) {
        bgGradient = 'from-orange-500 to-amber-600';
        borderColor = '#F97316';
        pulseRing = 'rgba(249, 115, 22, 0.4)';
      } else {
        bgGradient = 'from-yellow-400 to-amber-500';
        borderColor = '#EAB308';
        pulseRing = 'rgba(234, 179, 8, 0.3)';
      }
    } else if (type === 'wildfire') {
      symbol = '🔥';
      bgGradient = 'from-orange-500 via-red-600 to-amber-600';
      borderColor = '#EF4444';
      pulseRing = 'rgba(239, 68, 68, 0.6)';
    } else if (type === 'drought') {
      symbol = '☀️';
      bgGradient = 'from-amber-600 via-yellow-600 to-amber-800';
      borderColor = '#D97706';
      pulseRing = 'rgba(217, 119, 6, 0.6)';
    } else if (type === 'volcano') {
      symbol = '🌋';
      bgGradient = 'from-red-700 via-rose-800 to-space-950';
      borderColor = '#DC2626';
      pulseRing = 'rgba(220, 38, 38, 0.6)';
    } else if (type === 'cyclone' || type === 'storm') {
      symbol = '🌀';
      bgGradient = 'from-cyan-500 via-blue-600 to-indigo-700';
      borderColor = '#06B6D4';
      pulseRing = 'rgba(6, 182, 212, 0.6)';
    } else if (type === 'flood' || type === 'tsunami') {
      symbol = '🌊';
      bgGradient = 'from-blue-500 to-indigo-700';
      borderColor = '#3B82F6';
      pulseRing = 'rgba(59, 130, 246, 0.6)';
    }

    const isSelected = selectedDisaster?.id === props?.id;

    const html = `
      <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
        <div class="absolute w-8 h-8 rounded-full animate-ping opacity-60" style="background-color: ${pulseRing};"></div>
        <div class="w-7 h-7 rounded-full bg-gradient-to-br ${bgGradient} border-2 shadow-2xl flex items-center justify-center text-xs text-white font-bold" style="border-color: ${isSelected ? '#38BDF8' : borderColor}; box-shadow: 0 0 14px ${pulseRing};">
          <span style="font-size: 11px; line-height: 1;">${symbol}</span>
        </div>
        ${
          magnitude && type === 'earthquake'
            ? `<div class="absolute -bottom-2 px-1 rounded bg-space-950/90 border border-slate-700 text-[9px] font-mono text-cyan-300 font-bold leading-tight">M${typeof magnitude === 'number' ? magnitude.toFixed(1) : magnitude}</div>`
            : ''
        }
      </div>
    `;

    return L.divIcon({
      html,
      className: 'satquery-disaster-div-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  };

  const handleSelectEvent = (props: DisasterGeoJSONFeature['properties']) => {
    if (!props || !setSelectedDisaster) return;
    const eventObj: EarthEvent = {
      id: props.id,
      source: props.source || 'USGS',
      sources: props.sources || [props.source || 'USGS'],
      type: props.type || 'other',
      title: props.title || 'Earth Event',
      description: props.description,
      latitude: props.latitude,
      longitude: props.longitude,
      magnitude: props.magnitude,
      depth_km: props.depth_km,
      severity: props.severity || 'moderate',
      alert_level: props.alert_level || 'green',
      confidence: props.confidence,
      start_time: props.start_time,
      updated_time: props.updated_time,
      country: props.country,
      region: props.region,
      source_url: props.source_url,
    };

    setSelectedDisaster(eventObj);
  };

  const handleAnalyzeSatellite = (props: DisasterGeoJSONFeature['properties']) => {
    if (!props) return;
    const eventObj: EarthEvent = {
      id: props.id,
      source: props.source || 'USGS',
      sources: props.sources || [props.source || 'USGS'],
      type: props.type || 'other',
      title: props.title || 'Earth Event',
      description: props.description,
      latitude: props.latitude,
      longitude: props.longitude,
      magnitude: props.magnitude,
      depth_km: props.depth_km,
      severity: props.severity || 'moderate',
      alert_level: props.alert_level || 'green',
      confidence: props.confidence,
      start_time: props.start_time,
      updated_time: props.updated_time,
      country: props.country,
      region: props.region,
      source_url: props.source_url,
    };

    if (triggerSatelliteAnalysisForDisaster) {
      triggerSatelliteAnalysisForDisaster(eventObj);
    }
    if (typeof props.latitude === 'number' && typeof props.longitude === 'number') {
      map.flyTo([props.latitude, props.longitude], 12, { duration: 1.4 });
    }
  };

  return (
    <>
      {filteredFeatures.map((feat) => {
        if (!feat || !feat.properties) return null;
        const p = feat.properties;
        const lat = typeof p.latitude === 'number' ? p.latitude : (feat.geometry?.coordinates?.[1] ?? null);
        const lon = typeof p.longitude === 'number' ? p.longitude : (feat.geometry?.coordinates?.[0] ?? null);

        if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) return null;
        const coords: [number, number] = [lat, lon];
        const icon = getMarkerIcon(p);

        return (
          <Marker
            key={feat.id || `${lat}_${lon}`}
            position={coords}
            icon={icon}
            eventHandlers={{
              click: () => handleSelectEvent(p),
            }}
          >
            <Popup className="satquery-custom-popup">
              <div className="p-3 font-mono text-xs text-slate-100 bg-space-950 rounded-xl border border-cyan-500/50 shadow-2xl min-w-[260px] max-w-xs">
                {/* Header */}
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                    <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    <span className="uppercase text-[10px] tracking-wide">{p.type || 'EARTH'} EVENT</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                      p.alert_level === 'red'
                        ? 'bg-rose-950/80 border border-rose-500/60 text-rose-300'
                        : p.alert_level === 'orange'
                        ? 'bg-amber-950/80 border border-amber-500/60 text-amber-300'
                        : 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                    }`}
                  >
                    {p.severity || 'MODERATE'}
                  </span>
                </div>

                {/* Event Title */}
                <div className="pt-2 font-sans font-bold text-xs text-slate-100 leading-snug">
                  {p.title || 'Earth Observation Event'}
                </div>

                {/* Location & Coordinates */}
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Compass className="w-3 h-3 text-cyan-400" />
                  <span>
                    {lat.toFixed(3)}°, {lon.toFixed(3)}°
                  </span>
                  {p.country && <span>&bull; {p.country}</span>}
                </div>

                {/* Quantitative Telemetry */}
                <div className="mt-2 p-2 rounded-lg bg-space-900/80 border border-slate-800 space-y-1 text-[11px]">
                  {p.magnitude !== undefined && p.magnitude !== null && (typeof p.magnitude === 'number' ? p.magnitude > 0 : p.magnitude !== '0') ? (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">
                        {p.type === 'earthquake' ? 'Magnitude:' : p.type === 'wildfire' ? 'Radiative Power:' : 'Intensity:'}
                      </span>
                      <span className="font-bold text-amber-300 font-mono">
                        {p.type === 'earthquake' ? `M${typeof p.magnitude === 'number' ? p.magnitude.toFixed(1) : p.magnitude}` : `${p.magnitude} ${p.type === 'wildfire' ? 'MW' : ''}`}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Alert Tier:</span>
                      <span className="font-bold text-rose-300 font-mono">
                        {p.alert_level === 'red' || p.severity === 'critical' ? 'Red Alert Level' : 'Monitored Severity'}
                      </span>
                    </div>
                  )}

                  {p.depth_km !== undefined && p.depth_km !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Hypocenter Depth:</span>
                      <span className="font-bold text-slate-200 font-mono">
                        {typeof p.depth_km === 'number' ? p.depth_km.toFixed(1) : p.depth_km} km
                      </span>
                    </div>
                  )}

                  {p.start_time && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" /> Time:
                      </span>
                      <span className="text-slate-300">
                        {new Date(p.start_time).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] pt-0.5 border-t border-slate-800">
                    <span className="text-slate-500">Data Sources:</span>
                    <div className="flex items-center gap-1">
                      {(p.sources || [p.source || 'USGS']).map((s) => (
                        <span key={s} className="px-1 py-0.2 rounded bg-space-850 border border-slate-700 text-[9px] text-cyan-300 font-bold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center gap-1.5">
                  <button
                    onClick={() => handleAnalyzeSatellite(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-[10px] transition-all shadow-md"
                  >
                    <Satellite className="w-3.5 h-3.5" />
                    <span>Analyze Satellite</span>
                  </button>

                  <button
                    onClick={() => handleSelectEvent(p)}
                    className="flex items-center justify-center p-1.5 rounded-lg bg-space-850 hover:bg-space-800 border border-slate-700 text-slate-300 hover:text-white transition-all text-[10px]"
                    title="View Full Intelligence Details"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  {p.source_url && (
                    <a
                      href={p.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center p-1.5 rounded-lg bg-space-850 hover:bg-space-800 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-all text-[10px]"
                      title="Open Official Provider Source"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};
