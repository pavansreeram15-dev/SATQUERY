import { BoundingBox } from '../types/geo';

/**
 * Calculates approximate surface area in square kilometers for an EPSG:4326 BBOX.
 */
export function calculateBboxAreaKm2(bbox: BoundingBox): number {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const latMid = ((minLat + maxLat) / 2.0) * (Math.PI / 180.0);
  const kmPerDegreeLat = 111.132;
  const kmPerDegreeLon = 111.32 * Math.cos(latMid);

  const deltaLatKm = Math.abs(maxLat - minLat) * kmPerDegreeLat;
  const deltaLonKm = Math.abs(maxLon - minLon) * kmPerDegreeLon;

  return Math.round(deltaLatKm * deltaLonKm * 100.0) / 100.0;
}

/**
 * Format coordinates for display.
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latCard = lat >= 0 ? 'N' : 'S';
  const lonCard = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latCard}, ${Math.abs(lon).toFixed(4)}°${lonCard}`;
}

/**
 * Format BBOX to readable string.
 */
export function formatBbox(bbox: BoundingBox): string {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  return `[${minLat.toFixed(2)}°, ${minLon.toFixed(2)}° to ${maxLat.toFixed(2)}°, ${maxLon.toFixed(2)}°]`;
}
