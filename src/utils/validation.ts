import { BoundingBox } from '../types/geo';

/**
 * Validates whether a given array is a valid EPSG:4326 BBOX [min_lon, min_lat, max_lon, max_lat].
 */
export function isValidBbox(bbox: any): bbox is BoundingBox {
  if (!Array.isArray(bbox) || bbox.length !== 4) return false;
  const [minLon, minLat, maxLon, maxLat] = bbox;
  if (typeof minLon !== 'number' || typeof minLat !== 'number' || typeof maxLon !== 'number' || typeof maxLat !== 'number') {
    return false;
  }
  if (minLon < -180 || maxLon > 180 || minLat < -90 || maxLat > 90) return false;
  if (minLon >= maxLon || minLat >= maxLat) return false;
  return true;
}

/**
 * Validates prompt input string.
 */
export function isValidQueryPrompt(prompt: string): boolean {
  return typeof prompt === 'string' && prompt.trim().length >= 3;
}
