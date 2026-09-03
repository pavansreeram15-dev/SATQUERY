import { useState, useCallback } from 'react';
import { useMapContext } from '../context/MapContext';
import { BoundingBox } from '../types/geo';

export function useAOI() {
  const { viewportBbox, setViewportBbox, selectedRegion, setSelectedRegion } = useMapContext();
  const [drawingActive, setDrawingActive] = useState(false);

  const updateAOI = useCallback((bbox: BoundingBox, regionName?: string) => {
    setViewportBbox(bbox);
    if (regionName) {
      setSelectedRegion(regionName);
    }
  }, [setViewportBbox, setSelectedRegion]);

  return {
    viewportBbox,
    selectedRegion,
    drawingActive,
    setDrawingActive,
    updateAOI,
    setSelectedRegion,
  };
}
