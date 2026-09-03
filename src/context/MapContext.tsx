import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { BBox, LatLngCoord, ActiveLayerState, BasemapType, DrawModeType, ComparisonViewMode } from '../types/map';
import { SAMPLE_REGIONS, SampleRegion } from '../config/sampleRegions';
import { QueryResponse, GeoJSONFeature, LocationSearchResult, ComparisonResponse } from '../types/query';
import { EarthEvent, DisasterFeatureCollection, DisasterFilterState } from '../types/disaster';

export interface ComparisonState {
  enabled: boolean;
  viewMode: ComparisonViewMode; // 'slider' or 'side-by-side'
  sensor: string; // 'optical', 'sar', 'landsat'
  preset: string; // '1H', '24H', '7D', '30D', '3M', '6M', '1Y', 'CUSTOM'
  beforeYear: number;
  afterYear: number;
  beforeDate: string;
  afterDate: string;
  sliderPos: number; // 0 to 100 percentage
  comparisonResult: ComparisonResponse | null;
  isLoading: boolean;
}

export interface MapContextType {
  activeRegion: SampleRegion;
  setActiveRegion: (region: SampleRegion) => void;
  viewportBBox: BBox;
  setViewportBBox: (bbox: BBox) => void;
  drawnBBox: BBox | null;
  setDrawnBBox: (bbox: BBox | null) => void;
  drawnPolygon: LatLngCoord[] | null;
  setDrawnPolygon: (poly: LatLngCoord[] | null) => void;
  drawMode: DrawModeType;
  setDrawMode: (mode: DrawModeType) => void;
  isDrawingBBox: boolean;
  setIsDrawingBBox: (drawing: boolean) => void;
  clearDrawnAOI: () => void;
  layers: ActiveLayerState;
  toggleLayer: (layerName: keyof ActiveLayerState) => void;
  setBasemap: (basemap: BasemapType) => void;
  queryResult: QueryResponse | null;
  setQueryResult: (result: QueryResponse | null) => void;
  selectedFeature: GeoJSONFeature | null;
  setSelectedFeature: (feature: GeoJSONFeature | null) => void;
  comparison: ComparisonState;
  setComparison: React.Dispatch<React.SetStateAction<ComparisonState>>;
  selectRegionById: (regionId: string) => void;
  resetMapToRegion: () => void;
  // Search & Geocoding
  searchLocation: LocationSearchResult | null;
  setSearchLocation: (loc: LocationSearchResult | null) => void;
  // Live Disasters Subsystem
  selectedDisaster: EarthEvent | null;
  setSelectedDisaster: (disaster: EarthEvent | null) => void;
  disastersData: DisasterFeatureCollection | null;
  setDisastersData: React.Dispatch<React.SetStateAction<DisasterFeatureCollection | null>>;
  disasterFilters: DisasterFilterState;
  setDisasterFilters: React.Dispatch<React.SetStateAction<DisasterFilterState>>;
  triggerSatelliteAnalysisForDisaster: (disaster: EarthEvent) => void;
  // Provider Health Telemetry Modal
  providerHealthModalOpen: boolean;
  setProviderHealthModalOpen: (open: boolean) => void;
}

const defaultLayers: ActiveLayerState = {
  basemap: 'satellite',
  liveDisasters: true,
  detections: true,
  flood: true,
  ndvi: true,
  ndwi: true,
  change: true,
  bhuvanLulc: false,
  bhuvanFlood: false,
  bhuvanWasteland: false,
  bhuvanGeomorph: false,
  bboxDrawMode: false,
  splitComparison: false,
  liveAisVessels: true,
  aisSatelliteCorrelation: true,
};

const defaultDisasterFilters: DisasterFilterState = {
  timeRange: '24h',
  selectedTypes: [],
  selectedSeverities: [],
  selectedSource: 'ALL',
  searchQuery: '',
};

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRegion, setActiveRegion] = useState<SampleRegion>(SAMPLE_REGIONS[0]); // Chennai Port by default
  const [viewportBBox, setViewportBBox] = useState<BBox>(SAMPLE_REGIONS[0].bbox);
  const [drawnBBox, setDrawnBBox] = useState<BBox | null>(null);
  const [drawnPolygon, setDrawnPolygon] = useState<LatLngCoord[] | null>(null);
  const [drawMode, setDrawMode] = useState<DrawModeType>(null);
  const [isDrawingBBox, setIsDrawingBBox] = useState<boolean>(false);
  const [layers, setLayers] = useState<ActiveLayerState>(defaultLayers);
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null);
  const [searchLocation, setSearchLocation] = useState<LocationSearchResult | null>(null);
  const [providerHealthModalOpen, setProviderHealthModalOpen] = useState<boolean>(false);
  
  // Live Global Disaster Intelligence state
  const [selectedDisaster, setSelectedDisaster] = useState<EarthEvent | null>(null);
  const [disastersData, setDisastersData] = useState<DisasterFeatureCollection | null>(null);
  const [disasterFilters, setDisasterFilters] = useState<DisasterFilterState>(defaultDisasterFilters);

  const [comparison, setComparison] = useState<ComparisonState>({
    enabled: false,
    viewMode: 'slider',
    sensor: 'optical',
    preset: 'CUSTOM',
    beforeYear: 2023,
    afterYear: 2026,
    beforeDate: '2023-06-15',
    afterDate: '2026-06-15',
    sliderPos: 50,
    comparisonResult: null,
    isLoading: false,
  });

  const clearDrawnAOI = useCallback(() => {
    setDrawnBBox(null);
    setDrawnPolygon(null);
    setDrawMode(null);
    setIsDrawingBBox(false);
    setViewportBBox(activeRegion.bbox);
    setQueryResult(null);
    setSelectedFeature(null);
    setSearchLocation(null);
  }, [activeRegion.bbox]);

  const toggleLayer = useCallback((layerName: keyof ActiveLayerState) => {
    setLayers((prev) => ({
      ...prev,
      [layerName]: !prev[layerName],
    }));
  }, []);

  const setBasemap = useCallback((basemap: BasemapType) => {
    setLayers((prev) => ({
      ...prev,
      basemap,
    }));
  }, []);

  const selectRegionById = useCallback((regionId: string) => {
    const found = SAMPLE_REGIONS.find((r) => r.id === regionId);
    if (found) {
      setActiveRegion(found);
      setViewportBBox(found.bbox);
      setDrawnBBox(null);
      setDrawnPolygon(null);
      setDrawMode(null);
      setIsDrawingBBox(false);
      setSearchLocation(null);
      setQueryResult(null);
      setSelectedFeature(null);
      setComparison((prev) => ({ ...prev, enabled: false }));
    }
  }, []);

  const resetMapToRegion = useCallback(() => {
    setViewportBBox(activeRegion.bbox);
    setDrawnBBox(null);
    setDrawnPolygon(null);
    setDrawMode(null);
    setIsDrawingBBox(false);
    setSearchLocation(null);
  }, [activeRegion.bbox]);

  const triggerSatelliteAnalysisForDisaster = useCallback((disaster: EarthEvent) => {
    const lat = disaster.latitude;
    const lon = disaster.longitude;
    const span = 0.15;
    
    const disasterBBox: BBox = [
      Number((lon - span).toFixed(4)),
      Number((lat - span).toFixed(4)),
      Number((lon + span).toFixed(4)),
      Number((lat + span).toFixed(4)),
    ];

    setViewportBBox(disasterBBox);
    setDrawnBBox(disasterBBox);
    setSelectedDisaster(disaster);
    setQueryResult(null);
    setSelectedFeature(null);
  }, []);

  const contextValue = useMemo<MapContextType>(
    () => ({
      activeRegion,
      setActiveRegion,
      viewportBBox,
      setViewportBBox,
      drawnBBox,
      setDrawnBBox,
      drawnPolygon,
      setDrawnPolygon,
      drawMode,
      setDrawMode,
      isDrawingBBox,
      setIsDrawingBBox,
      clearDrawnAOI,
      layers,
      toggleLayer,
      setBasemap,
      queryResult,
      setQueryResult,
      selectedFeature,
      setSelectedFeature,
      comparison,
      setComparison,
      selectRegionById,
      resetMapToRegion,
      searchLocation,
      setSearchLocation,
      selectedDisaster,
      setSelectedDisaster,
      disastersData,
      setDisastersData,
      disasterFilters,
      setDisasterFilters,
      triggerSatelliteAnalysisForDisaster,
      providerHealthModalOpen,
      setProviderHealthModalOpen,
    }),
    [
      activeRegion,
      viewportBBox,
      drawnBBox,
      drawnPolygon,
      drawMode,
      isDrawingBBox,
      clearDrawnAOI,
      layers,
      toggleLayer,
      setBasemap,
      queryResult,
      selectedFeature,
      comparison,
      selectRegionById,
      resetMapToRegion,
      searchLocation,
      selectedDisaster,
      disastersData,
      disasterFilters,
      triggerSatelliteAnalysisForDisaster,
      providerHealthModalOpen,
    ]
  );

  return (
    <MapContext.Provider value={contextValue}>
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = (): MapContextType => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};
