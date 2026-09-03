/**
 * Format metric numbers with appropriate units.
 */
export function formatMetric(val: number | undefined | null, decimals = 2, suffix = ''): string {
  if (val === undefined || val === null) return 'N/A';
  return `${val.toLocaleString(undefined, { maximumFractionDigits: decimals })}${suffix}`;
}

/**
 * Format confidence percentage.
 */
export function formatConfidence(score?: number): string {
  if (score === undefined || score === null) return 'N/A';
  const percentage = score > 1 ? score : score * 100;
  return `${percentage.toFixed(1)}%`;
}

/**
 * Format area in km² or hectares.
 */
export function formatArea(areaKm2?: number): string {
  if (areaKm2 === undefined || areaKm2 === null) return 'N/A';
  if (areaKm2 < 1) {
    const ha = areaKm2 * 100;
    return `${ha.toFixed(1)} ha`;
  }
  return `${areaKm2.toLocaleString(undefined, { maximumFractionDigits: 2 })} km²`;
}
