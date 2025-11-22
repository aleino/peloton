import { scaleLinear, scaleLog, scaleQuantile } from 'd3-scale';
import type { ExpressionSpecification } from 'mapbox-gl';

/**
 * Viridis color scale as a simple array for Mapbox expressions
 * Order: 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1.0
 */
export const VIRIDIS_COLOR_ARRAY = [
  '#440154', // 0.0 - deep purple
  '#48186a', // 0.1
  '#3f4a8a', // 0.2
  '#31688e', // 0.3
  '#26838f', // 0.4
  '#1f9d88', // 0.5
  '#35b779', // 0.6
  '#6ece58', // 0.7
  '#b5de2b', // 0.8
  '#fde725', // 1.0 - bright yellow-green
] as const;

/**
 * Calculate min and max departure counts from station data
 *
 * Helper function to extract departure range from GeoJSON features.
 * Can optionally use percentiles to exclude extreme outliers.
 *
 * @param stations - Array of station features with totalDepartures in properties
 * @param usePercentiles - If true, use 2nd and 98th percentiles instead of absolute min/max
 * @returns Object with min and max departure counts
 *
 * @example
 * ```typescript
 * // Use absolute min/max (default)
 * const { minDepartures, maxDepartures } = getDepartureRange(stationFeatures);
 *
 * // Use percentiles to handle extreme outliers
 * const range = getDepartureRange(stationFeatures, true);
 * const colorScale = createViridisScale(range.minDepartures, range.maxDepartures);
 * ```
 */
export function getDepartureRange(
  stations: Array<{ properties: { totalDepartures?: number } }>,
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
    // Sort and use percentiles to exclude extreme outliers
    const sorted = [...departures].sort((a, b) => a - b);
    const p5Index = Math.max(0, Math.floor(sorted.length * 0.05));
    const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));

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
 *
 * @param minValue - Minimum value in the dataset
 * @param maxValue - Maximum value in the dataset
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
    return VIRIDIS_COLOR_ARRAY[5]!; // Middle color (teal)
  }

  // Create D3 linear scale
  const scale = scaleLinear<number>().domain([minValue, maxValue]).range([0, 1]).clamp(true);

  // Map normalized t-values to actual data values
  const VIRIDIS_T_STOPS = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1.0];

  return [
    'interpolate',
    ['linear'],
    inputValue,
    ...VIRIDIS_T_STOPS.flatMap((t) => {
      const value = scale.invert(t);
      return [value, VIRIDIS_COLOR_ARRAY[Math.round(t * 10)]!];
    }),
  ] as ExpressionSpecification;
}

/**
 * Create a Mapbox interpolate expression for logarithmic scale
 *
 * Uses D3's scaleLog to map values to colors from the Viridis color scale.
 * Useful for data with exponential distributions or wide ranges.
 * Small values get more color resolution than large values.
 *
 * @param minValue - Minimum value in the dataset (must be > 0)
 * @param maxValue - Maximum value in the dataset
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
    return VIRIDIS_COLOR_ARRAY[5]!; // Middle color (teal)
  }

  // Ensure minValue is positive for log scale
  const safeMin = Math.max(minValue, 1);

  // Create D3 log scale
  const scale = scaleLog<number>().domain([safeMin, maxValue]).range([0, 1]).clamp(true);

  // Map normalized t-values to actual data values using log scale
  const VIRIDIS_T_STOPS = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1.0];

  return [
    'interpolate',
    ['linear'],
    inputValue,
    ...VIRIDIS_T_STOPS.flatMap((t) => {
      const value = scale.invert(t);
      return [value, VIRIDIS_COLOR_ARRAY[Math.round(t * 10)]!];
    }),
  ] as ExpressionSpecification;
}

/**
 * Create a Mapbox step expression for quantile (decile) scale
 *
 * Uses D3's scaleQuantile to divide data into equal-sized buckets (deciles).
 * Each bucket gets a distinct color from the Viridis scale.
 * Ensures equal number of data points in each color bin.
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
    return VIRIDIS_COLOR_ARRAY[5]!; // Middle color (teal)
  }

  // Create D3 quantile scale (deciles)
  const scale = scaleQuantile<string>().domain(values).range(VIRIDIS_COLOR_ARRAY);

  // Get quantile thresholds (breakpoints between deciles)
  const quantiles = scale.quantiles();

  // Build Mapbox step expression
  // Format: ['step', input, color0, threshold1, color1, threshold2, color2, ...]
  const stepExpression: ExpressionSpecification = [
    'step',
    inputValue,
    VIRIDIS_COLOR_ARRAY[0]!, // Base color for values below first threshold
    ...quantiles.flatMap((threshold, i) => [threshold, VIRIDIS_COLOR_ARRAY[i + 1]!]),
  ] as ExpressionSpecification;

  return stepExpression;
}
