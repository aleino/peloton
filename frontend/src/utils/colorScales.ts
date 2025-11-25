import { scaleLinear, scaleLog, scaleQuantile } from 'd3-scale';
import type { ExpressionSpecification } from 'mapbox-gl';

/**
 * Viridis color scale with paired t-stops and colors for Mapbox expressions
 * Each stop defines a normalized position (t) and corresponding color
 */
export const VIRIDIS_SCALE = {
  stops: [
    { t: 0.0, color: '#440154' }, // deep purple
    { t: 0.1, color: '#48186a' },
    { t: 0.2, color: '#3f4a8a' },
    { t: 0.3, color: '#31688e' },
    { t: 0.4, color: '#26838f' },
    { t: 0.5, color: '#1f9d88' },
    { t: 0.6, color: '#35b779' },
    { t: 0.7, color: '#6ece58' },
    { t: 0.8, color: '#b5de2b' },
    { t: 0.9, color: '#c8e020' },
    { t: 1.0, color: '#fde725' }, // bright yellow-green
  ],
  /** Convenience accessor for just the colors */
  get colors() {
    return this.stops.map((s) => s.color);
  },
  /** Convenience accessor for just the t-values */
  get tValues() {
    return this.stops.map((s) => s.t);
  },
} as const;

/**
 * @deprecated Use VIRIDIS_SCALE.colors instead
 * Kept for backward compatibility
 */
export const VIRIDIS_COLOR_ARRAY = VIRIDIS_SCALE.colors;

/**
 * Calculate min and max departure counts from station data
 *
 * Helper function to extract departure range from GeoJSON features.
 * Can optionally use percentiles to exclude extreme outliers.
 *
 * @param stations - Array of station features with totalDepartures in properties
 * @param usePercentiles - If true, use 5th and 95th percentiles instead of absolute min/max
 * @returns Object with min and max departure counts
 *
 * @example
 * ```typescript
 * // Use absolute min/max (default)
 * const { minDepartures, maxDepartures } = getDepartureRange(stationFeatures);
 *
 * // Use percentiles to handle extreme outliers (discards top/bottom 5%)
 * const range = getDepartureRange(stationFeatures, true);
 * const colorScale = createViridisScale(range.minDepartures, range.maxDepartures);
 * ```
 */
export function getDepartureRange(
  stations: Array<{
    properties: { totalDepartures?: number };
  }>,
  usePercentiles = false
): {
  minDepartures: number;
  maxDepartures: number;
} {
  const departures = stations
    .map((s) => s.properties.totalDepartures ?? 0)
    .filter((d) => d !== undefined);

  if (departures.length === 0) {
    return { minDepartures: 0, maxDepartures: 0 };
  }

  if (usePercentiles) {
    // Sort and use percentiles to exclude extreme outliers (discard top/bottom 5%)
    const sorted = [...departures].sort((a, b) => a - b);
    const p5Index = Math.max(0, Math.floor(sorted.length * 0.05));
    const p95Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);

    return {
      minDepartures: sorted[p5Index] ?? 0,
      maxDepartures: sorted[p95Index] ?? 0,
    };
  }

  return {
    minDepartures: Math.min(...departures),
    maxDepartures: Math.max(...departures),
  };
}

/**
 * Create a Mapbox interpolate expression for linear scale
 *
 * Uses D3's scaleLinear to map values to colors from the Viridis color scale.
 * Distributes colors evenly across the value range.
 * Note: Top and bottom 5% of values are clamped to the scale endpoints.
 *
 * @param minValue - Minimum value in the dataset (5th percentile)
 * @param maxValue - Maximum value in the dataset (95th percentile)
 * @param inputValue - Mapbox expression to use as input (e.g., ['get', 'totalDepartures'])
 * @returns Mapbox interpolate expression for linear color mapping
 */
export function createLinearColorExpression(
  minValue: number,
  maxValue: number,
  inputValue: ExpressionSpecification
): string | ExpressionSpecification {
  // Handle edge case where all values are the same
  if (minValue === maxValue) {
    return VIRIDIS_SCALE.stops[5]!.color; // Middle color (teal)
  }

  // Create D3 linear scale with clamping to handle outliers
  const scale = scaleLinear<number>().domain([minValue, maxValue]).range([0, 1]).clamp(true);

  return [
    'interpolate',
    ['linear'],
    inputValue,
    ...VIRIDIS_SCALE.stops.flatMap((stop) => {
      const value = scale.invert(stop.t);
      return [value, stop.color];
    }),
  ] as ExpressionSpecification;
}

/**
 * Create a Mapbox interpolate expression for logarithmic scale
 *
 * Uses D3's scaleLog to map values to colors from the Viridis color scale.
 * Useful for data with exponential distributions or wide ranges.
 * Small values get more color resolution than large values.
 * Note: Top and bottom 5% of values are clamped to the scale endpoints.
 *
 * @param minValue - Minimum value in the dataset (5th percentile, must be > 0)
 * @param maxValue - Maximum value in the dataset (95th percentile)
 * @param inputValue - Mapbox expression to use as input (e.g., ['get', 'totalDepartures'])
 * @returns Mapbox interpolate expression for logarithmic color mapping
 */
export function createLogColorExpression(
  minValue: number,
  maxValue: number,
  inputValue: ExpressionSpecification
): string | ExpressionSpecification {
  // Handle edge cases
  if (minValue === maxValue) {
    return VIRIDIS_SCALE.stops[5]!.color; // Middle color (teal)
  }

  // Ensure minValue is positive for log scale
  const safeMin = Math.max(minValue, 1);

  // Create D3 log scale with clamping to handle outliers
  const scale = scaleLog<number>().domain([safeMin, maxValue]).range([0, 1]).clamp(true);

  return [
    'interpolate',
    ['linear'],
    inputValue,
    ...VIRIDIS_SCALE.stops.flatMap((stop) => {
      const value = scale.invert(stop.t);
      return [value, stop.color];
    }),
  ] as ExpressionSpecification;
}

/**
 * Create a Mapbox step expression for quantile (decile) scale
 *
 * Uses D3's scaleQuantile to divide data into equal-sized buckets (deciles).
 * Each bucket gets a distinct color from the Viridis scale.
 * Ensures equal number of data points in each color bin.
 * Note: Top and bottom 5% of values are discarded before calculating quantiles.
 *
 * @param values - Array of all values in the dataset
 * @param inputValue - Mapbox expression to use as input (e.g., ['get', 'totalDepartures'])
 * @returns Mapbox step expression for quantile color mapping
 */
export function createQuantileColorExpression(
  values: number[],
  inputValue: ExpressionSpecification
): string | ExpressionSpecification {
  // Handle edge cases
  if (values.length === 0) {
    return '#cccccc'; // Fallback color
  }

  if (values.length === 1 || Math.min(...values) === Math.max(...values)) {
    return VIRIDIS_SCALE.stops[5]!.color; // Middle color (teal)
  }

  // Sort values and trim top/bottom 5%
  const sorted = [...values].sort((a, b) => a - b);
  const p5Index = Math.max(0, Math.floor(sorted.length * 0.05));
  const p95Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  const trimmedValues = sorted.slice(p5Index, p95Index + 1);

  // Create D3 quantile scale (deciles) with trimmed values
  const scale = scaleQuantile<string>().domain(trimmedValues).range(VIRIDIS_SCALE.colors);

  // Get quantile thresholds (breakpoints between deciles)
  const quantiles = scale.quantiles();

  // Build Mapbox step expression
  // Format: ['step', input, color0, threshold1, color1, threshold2, color2, ...]
  const stepExpression: ExpressionSpecification = [
    'step',
    inputValue,
    VIRIDIS_SCALE.colors[0]!, // Base color for values below first threshold
    ...quantiles.flatMap((threshold, i) => [threshold, VIRIDIS_SCALE.colors[i + 1]!]),
  ] as ExpressionSpecification;

  return stepExpression;
}
