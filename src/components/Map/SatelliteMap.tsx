import React, { useEffect, useState, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Rectangle,
  Polygon,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { useMapContext } from '../../context/MapContext';
import { BASEMAP_TILES } from '../../config/mapConfig';
import { MapControls } from './MapControls';
import { BoundingBoxSelector } from './BoundingBoxSelector';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { DetectionLayer } from './DetectionLayer';
import { FloodLayer } from './FloodLayer';
import { ChangeLayer } from './ChangeLayer';
import { BhuvanLayer } from './BhuvanLayer';
import { LiveDisastersLayer } from './LiveDisastersLayer';
import { AISVesselsLayer } from './AISVesselsLayer';
import { MaritimeControlBar } from '../Dashboard/MaritimeControlBar';
import { DisasterInfoPanel } from '../Dashboard/DisasterInfoPanel';
import { DisasterFilterBar } from '../Dashboard/DisasterFilterBar';
import { divIcon } from 'leaflet';
import { BBox } from '../../types/map';
import { SAMPLE_REGIONS } from '../../config/sampleRegions';
import { AISVessel, AISFilterState, AISStatusResponse, AISCorrelationMatch } from '../../types/ais';
import { aisApi } from '../../services/aisApi';
import { cableApi } from '../../services/cableApi';
import { SubmarineCablesLayer } from './SubmarineCablesLayer';
import { SubmarineCableFeature, LandingPointFeature } from '../../types/cable';

// Subcomponent to handle interactive AOI drawing on map
const MapDrawingHandler: React.FC = () => {
  const { drawMode, setDrawnBBox, setDrawnPolygon, setIsDrawingBBox } = useMapContext();
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);

  useMapEvents({
    click: (e) => {
      if (drawMode === 'box') {
        if (!startPoint) {
          setStartPoint([e.latlng.lat, e.latlng.lng]);
          setIsDrawingBBox(true);
        } else {
          const minLat = Math.min(startPoint[0], e.latlng.lat);
          const maxLat = Math.max(startPoint[0], e.latlng.lat);
          const minLng = Math.min(startPoint[1], e.latlng.lng);
          const maxLng = Math.max(startPoint[1], e.latlng.lng);
          setDrawnBBox([
            Number(minLng.toFixed(4)),
            Number(minLat.toFixed(4)),
            Number(maxLng.toFixed(4)),
            Number(maxLat.toFixed(4)),
          ]);
          setStartPoint(null);
          setIsDrawingBBox(false);
        }
      }
    },
  });

  return null;
};

// Subcomponent to animate and synchronize map center/zoom with active region, search location, or disaster
const MapViewController: React.FC = () => {
  const { activeRegion, drawnBBox, drawnPolygon, selectedDisaster, searchLocation } = useMapContext();
  const map = useMap();

  useEffect(() => {
    try {
      if (searchLocation) {
        map.flyTo([searchLocation.lat, searchLocation.lon], 12, { duration: 1.5 });
      } else if (
        selectedDisaster &&
        typeof selectedDisaster.latitude === 'number' &&
        typeof selectedDisaster.longitude === 'number' &&
        !isNaN(selectedDisaster.latitude) &&
        !isNaN(selectedDisaster.longitude)
      ) {
        map.flyTo([selectedDisaster.latitude, selectedDisaster.longitude], 11, { duration: 1.4 });
      } else if (drawnPolygon && drawnPolygon.length >= 3) {
        map.fitBounds(drawnPolygon, { padding: [40, 40], duration: 1.2 });
      } else if (drawnBBox && drawnBBox.length === 4) {
        map.fitBounds([
          [drawnBBox[1], drawnBBox[0]],
          [drawnBBox[3], drawnBBox[2]],
        ], { padding: [40, 40], duration: 1.2 });
      } else if (activeRegion?.center && typeof activeRegion.zoom === 'number') {
        map.flyTo(activeRegion.center, activeRegion.zoom, { duration: 1.5 });
      }
    } catch (e) {
      console.warn('[MapViewController] Map navigation error caught safely:', e);
    }
  }, [activeRegion, drawnBBox, drawnPolygon, selectedDisaster, searchLocation, map]);

  return null;
};

// Subcomponent inside MapContainer to continuously synchronize viewport & fetch live AIS vessels
const AISMapIntegration: React.FC<{
  filters: AISFilterState;
  onVesselsUpdated: (vessels: AISVessel[], status: AISStatusResponse | null) => void;
  selectedVessel: AISVessel | null;
}> = ({ filters, onVesselsUpdated, selectedVessel }) => {
  const map = useMap();
  const { layers, queryResult } = useMapContext();
  const [vessels, setVessels] = useState<AISVessel[]>([]);
  const fetchVesselsForViewport = useCallback(async () => {
    try {
      const bounds = map.getBounds();
      const currentBBox: BBox = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];
      const liveVessels = await aisApi.getVessels(currentBBox, filters);
      setVessels(liveVessels);
      const st = await aisApi.getStatus();
      onVesselsUpdated(liveVessels, st);
    } catch (err) {
      console.warn('[AISMapIntegration] Fetch error:', err);
    }
  }, [map, filters, onVesselsUpdated]);

  useEffect(() => {
    fetchVesselsForViewport();
    const interval = setInterval(fetchVesselsForViewport, 10000);
    return () => clearInterval(interval);
  }, [fetchVesselsForViewport]);

  useMapEvents({
    moveend: () => fetchVesselsForViewport(),
    zoomend: () => fetchVesselsForViewport(),
  });

  return (
    <AISVesselsLayer map={map} vessels={vessels} enabled={!!layers.liveAisVessels} />
  );
};

// Subcomponent inside MapContainer to continuously synchronize viewport & fetch submarine cables
const CablesMapIntegration: React.FC = () => {
  const map = useMap();
  const { layers } = useMapContext();
  const [cables, setCables] = useState<SubmarineCableFeature[]>([]);
  const [landingPoints, setLandingPoints] = useState<LandingPointFeature[]>([]);

  const fetchCablesForViewport = useCallback(async () => {
    if (!layers.submarineCables) return;
    try {
      const bounds = map.getBounds();
      const currentBBox: BBox = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];
      const cableData = await cableApi.getCables(currentBBox);
      const lpData = await cableApi.getLandingPoints(currentBBox);
      setCables(cableData.features || []);
      setLandingPoints(lpData.features || []);
    } catch (err) {
      console.warn('[CablesMapIntegration] Submarine cable fetch warning:', err);
    }
  }, [map, layers.submarineCables]);

  useEffect(() => {
    fetchCablesForViewport();
  }, [fetchCablesForViewport]);

  useMapEvents({
    moveend: () => fetchCablesForViewport(),
    zoomend: () => fetchCablesForViewport(),
  });

  return (
    <SubmarineCablesLayer
      map={map}
      cables={cables}
      landingPoints={landingPoints}
      enabled={!!layers.submarineCables}
    />
  );
};

const searchIcon = divIcon({
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(6, 182, 212, 0.3); border: 1.5px solid #06b6d4; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 24px; height: 24px; border-radius: 50%; background: #0891b2; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
          <path d="M2 12h20"/>
        </svg>
      </div>
    </div>
  `,
  className: 'custom-search-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

export const SatelliteMap: React.FC = () => {
  const { activeRegion, drawnBBox, drawnPolygon, layers, searchLocation } = useMapContext();
  const safeActiveRegion = activeRegion || SAMPLE_REGIONS[0];
  const safeLayers = layers || { basemap: 'satellite', liveDisasters: true };
  const basemap = BASEMAP_TILES[safeLayers.basemap] || BASEMAP_TILES.satellite;

  // Maritime State
  const [aisVessels, setAisVessels] = useState<AISVessel[]>([]);
  const [aisStatus, setAisStatus] = useState<AISStatusResponse | null>(null);
  const [searchResults, setSearchResults] = useState<AISVessel[]>([]);
  const [selectedVessel, setSelectedVessel] = useState<AISVessel | null>(null);
  const [aisFilters, setAisFilters] = useState<AISFilterState>({
    selectedTypes: [],
    speedRange: 'ALL',
    navStatus: 'ALL',
    searchQuery: '',
  });

  // Selected rectangle coordinates
  const displayBBox = drawnBBox || safeActiveRegion.bbox || [80.27, 13.07, 80.34, 13.14];
  const rectangleBounds: [[number, number], [number, number]] = [
    [displayBBox[1], displayBBox[0]],
    [displayBBox[3], displayBBox[2]],
  ];

  const handleVesselSearch = async (q: string) => {
    setAisFilters((prev) => ({ ...prev, searchQuery: q }));
    if (q.trim()) {
      try {
        const res = await aisApi.searchVessels(q);
        setSearchResults(res.vessels);
      } catch (err) {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleVesselsUpdated = useCallback((vessels: AISVessel[], status: AISStatusResponse | null) => {
    setAisVessels(vessels);
    setAisStatus(status);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-space-950">
      <MapContainer
        center={safeActiveRegion.center || [13.0827, 80.2707]}
        zoom={safeActiveRegion.zoom || 13}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <MapViewController />
        <MapDrawingHandler />
        
        <AISMapIntegration
          filters={aisFilters}
          onVesselsUpdated={handleVesselsUpdated}
          selectedVessel={selectedVessel}
        />

        <CablesMapIntegration />

        {/* Primary Basemap */}
        <TileLayer
          key={safeLayers.basemap}
          url={basemap.url}
          attribution={basemap.attribution}
          maxZoom={basemap.maxZoom}
          maxNativeZoom={basemap.maxNativeZoom || 18}
        />

        {/* Bhuvan WMS Thematic Overlays */}
        <BhuvanLayer />

        {/* Active Bounding Box Highlight */}
        {!drawnPolygon && (
          <Rectangle
            bounds={rectangleBounds}
            pathOptions={{
              color: '#06B6D4',
              weight: 2,
              dashArray: '5, 5',
              fillColor: '#0891B2',
              fillOpacity: 0.08,
            }}
          />
        )}

        {/* Active Custom Polygon AOI */}
        {drawnPolygon && drawnPolygon.length >= 3 && (
          <Polygon
            positions={drawnPolygon}
            pathOptions={{
              color: '#06B6D4',
              weight: 2.5,
              dashArray: '4, 4',
              fillColor: '#0891B2',
              fillOpacity: 0.12,
            }}
          />
        )}

        {/* Search Location Marker */}
        {searchLocation && (
          <Marker position={[searchLocation.lat, searchLocation.lon]} icon={searchIcon}>
            <Popup className="satquery-popup font-mono text-xs">
              <div className="p-2 space-y-1">
                <div className="font-bold text-cyan-300 font-sans">{searchLocation.display_name}</div>
                <div className="text-[10px] text-slate-300">
                  Coordinates: {searchLocation.lat.toFixed(4)}°, {searchLocation.lon.toFixed(4)}°
                </div>
                <div className="text-[9px] text-slate-400">
                  Provider: {searchLocation.provider}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Remote Sensing AI Layers */}
        <DetectionLayer />
        <FloodLayer />
        <ChangeLayer />

        {/* Live Global Disaster & Earth Event Intelligence Layer */}
        <LiveDisastersLayer />
      </MapContainer>

      {/* Floating Maritime Control Bar (Top Right) */}
      <div className="absolute top-4 right-4 z-[360] w-80 max-w-[calc(100vw-2rem)]">
        <MaritimeControlBar
          status={aisStatus}
          vesselsCount={aisVessels.length}
          filters={aisFilters}
          onFilterChange={setAisFilters}
          onSearchVessel={handleVesselSearch}
          searchResults={searchResults}
          onSelectVessel={setSelectedVessel}
        />
      </div>

      {/* Live Disasters Filter & Multi-Hazard Controls Toolbar */}
      <DisasterFilterBar />

      {/* Selected Disaster Intelligence & Sentinel Hub Action Drawer */}
      <DisasterInfoPanel />

      {/* Floating Interactive Controls & Telemetry */}
      <MapControls />
      <BeforeAfterSlider />

      {/* Floating AOI Survey Footprint Drawer */}
      <div className="absolute bottom-4 left-4 z-[350] max-w-xs">
        <BoundingBoxSelector />
      </div>
    </div>
  );
};
