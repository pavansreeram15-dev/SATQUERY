import { useState, useCallback } from 'react';
import { satelliteApi } from '../services/satelliteApi';
import { TileInfo, SatelliteObservation, SatelliteSearchRequest } from '../types';

export function useSatelliteData() {
  const [tiles, setTiles] = useState<TileInfo[]>([]);
  const [observations, setObservations] = useState<SatelliteObservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTiles = useCallback(async (region?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await satelliteApi.listTiles(region);
      setTiles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch satellite tiles');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchImagery = useCallback(async (req: SatelliteSearchRequest) => {
    setLoading(true);
    setError(null);
    try {
      const results = await satelliteApi.searchImagery(req);
      setObservations(results);
      return results;
    } catch (err: any) {
      setError(err.message || 'Satellite STAC search failed');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tiles,
    observations,
    loading,
    error,
    fetchTiles,
    searchImagery,
  };
}
