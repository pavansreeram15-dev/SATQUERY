import { useMapContext } from '../context/MapContext';

export function useMap() {
  const mapContext = useMapContext();
  return {
    ...mapContext,
    center: mapContext.center,
    zoom: mapContext.zoom,
    viewportBbox: mapContext.viewportBbox,
    activeLayers: mapContext.activeLayers,
    selectedRegion: mapContext.selectedRegion,
    setCenter: mapContext.setCenter,
    setZoom: mapContext.setZoom,
    setViewportBbox: mapContext.setViewportBbox,
    toggleLayer: mapContext.toggleLayer,
    setSelectedRegion: mapContext.setSelectedRegion,
  };
}
