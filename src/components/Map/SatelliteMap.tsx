import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Rectangle,
  Polygon,
  Marker,
  Popup,
  CircleMarker,
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
import { DisasterInfoPanel } from '../Dashboard/DisasterInfoPanel';
import { DisasterFilterBar } from '../Dashboard/DisasterFilterBar';
import { LatLng, divIcon } from 'leaflet';
import { BBox, LatLngCoord } from '../../types/map';
import { SAMPLE_REGIONS } from '../../config/sampleRegions';
import { MapPin, Sparkles } from 'lucide-react';

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

// Subcomponent to handle interactive AOI drawing (Rectangle and Polygon)
const MapDrawingHandler: React.FC = () => {
  const {
    isDrawingBBox,
    drawMode,
    setDrawnBBox,
    setDrawnPolygon,
    setIsDrawingBBox,
    setDrawMode,
    setViewportBBox,
    setQueryResult,
    setSelectedFeature,
  } = useMapContext();

  const [boxStart, setBoxStart] = useState<LatLng | null>(null);
  const [polyPoints, setPolyPoints] = useState<LatLngCoord[]>([]);

  useMapEvents({
    click(e) {
      if (!isDrawingBBox) return;

      if (drawMode === 'box') {
        if (!boxStart) {
          setBoxStart(e.latlng);
        } else {
          const minLon = Math.min(boxStart.lng, e.latlng.lng);
          const maxLon = Math.max(boxStart.lng, e.latlng.lng);
          const minLat = Math.min(boxStart.lat, e.latlng.lat);
          const maxLat = Math.max(boxStart.lat, e.latlng.lat);

          const newBBox: BBox = [
            Number(minLon.toFixed(4)),
            Number(minLat.toFixed(4)),
            Number(maxLon.toFixed(4)),
            Number(maxLat.toFixed(4)),
          ];

          setDrawnBBox(newBBox);
          setDrawnPolygon(null);
          setViewportBBox(newBBox);
          setQueryResult(null);
          setSelectedFeature(null);
          setBoxStart(null);
          setIsDrawingBBox(false);
          setDrawMode(null);
        }
      } else if (drawMode === 'polygon') {
        const newPt: LatLngCoord = [Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5))];
        const nextPoints = [...polyPoints, newPt];
        setPolyPoints(nextPoints);

        // Calculate bounding box of polygon points
        const lats = nextPoints.map((p) => p[0]);
        const lons = nextPoints.map((p) => p[1]);
        const newBBox: BBox = [
          Number(Math.min(...lons).toFixed(4)),
          Number(Math.min(...lats).toFixed(4)),
          Number(Math.max(...lons).toFixed(4)),
          Number(Math.max(...lats).toFixed(4)),
        ];

        setDrawnPolygon(nextPoints);
        setDrawnBBox(newBBox);
        setViewportBBox(newBBox);
      }
    },
    dblclick(e) {
      if (isDrawingBBox && drawMode === 'polygon' && polyPoints.length >= 3) {
        setIsDrawingBBox(false);
        setDrawMode(null);
        setPolyPoints([]);
      }
    },
  });

  return null;
};

// Search Pin Icon
const searchIcon = divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <span class="absolute w-8 h-8 rounded-full bg-cyan-500/30 animate-ping"></span>
      <div class="w-6 h-6 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-lg shadow-cyan-500/50 border-2 border-white">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
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

  // Selected rectangle coordinates
  const displayBBox = drawnBBox || safeActiveRegion.bbox || [80.27, 13.07, 80.34, 13.14];
  const rectangleBounds: [[number, number], [number, number]] = [
    [displayBBox[1], displayBBox[0]],
    [displayBBox[3], displayBBox[2]],
  ];

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

        {/* Primary Basemap */}
        <TileLayer
          key={safeLayers.basemap}
          url={basemap.url}
          attribution={basemap.attribution}
          maxZoom={basemap.maxZoom}
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
