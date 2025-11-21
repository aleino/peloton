import { scaleSequential } from 'd3-scale';
import { interpolateViridis } from 'd3-scale-chromatic';

/**
 * Transformation type for normalizing skewed data distributions
 *
 * - `'linear'`: Direct mapping, best for normally distributed data
 * - `'log'`: Logarithmic scale, recommended when a few outliers dominate the range
 * - `'sqrt'`: Square root scale, moderate compression for less extreme skew
 */
export type ScaleTransformation = 'linear' | 'log' | 'sqrt';

/**
 * Apply transformation to a value to handle skewed distributions
 *
 * @param value - Value to transform
 * @param transformation - Type of transformation to apply
 * @returns Transformed value
 */
function applyTransformation(value: number, transformation: ScaleTransformation): number {
  switch (transformation) {
    case 'log':
      // log(x + 1) to handle zero values
      return Math.log(value + 1);
    case 'sqrt':
      return Math.sqrt(value);
    case 'linear':
    default:
      return value;
  }
}

/**
 * Normalize a value to 0-1 range based on min/max
 *
 * @param value - Value to normalize
 * @param min - Minimum value in dataset
 * @param max - Maximum value in dataset
 * @returns Normalized value between 0 and 1
 */
export function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) {
    return 0.5; // Middle value if no variance
  }
  return (value - min) / (max - min);
}

/**
 * Create a Viridis color scale for station departures
 *
 * Returns a function that maps departure counts to Viridis colors.
 * **Always uses the full Viridis spectrum**: min value → purple, max value → yellow
 *
 * Supports transformations to handle skewed distributions:
 * - 'linear': Direct mapping (default)
 * - 'log': Logarithmic scale - useful when a few stations have extremely high traffic
 * - 'sqrt': Square root scale - moderate compression of outliers
 *
 * The transformation is applied before normalizing to [0, 1], ensuring the full
 * color range is always utilized regardless of the data distribution.
 *
 * @param minDepartures - Minimum departure count across all stations
 * @param maxDepartures - Maximum departure count across all stations
 * @param transformation - Type of scale transformation to apply (default: 'linear')
 * @returns Function that takes a departure count and returns a hex color
 *
 * @example
 * ```typescript
 * // Linear scale
 * const linearScale = createViridisScale(0, 5000);
 * const color1 = linearScale(0);    // "#440154" (purple)
 * const color2 = linearScale(2500); // "#21918c" (teal)
 * const color3 = linearScale(5000); // "#fde725" (yellow)
 *
 * // Logarithmic scale for skewed data (e.g., 10 to 100,000 departures)
 * // Still uses full purple-to-yellow range, but distributed logarithmically
 * const logScale = createViridisScale(10, 100000, 'log');
 * const color4 = logScale(10);     // "#440154" (purple - min value)
 * const color5 = logScale(1000);   // "#21918c" (teal - middle of log scale)
 * const color6 = logScale(100000); // "#fde725" (yellow - max value)
 * ```
 */
export function createViridisScale(
  minDepartures: number,
  maxDepartures: number,
  transformation: ScaleTransformation = 'linear'
): (departures: number) => string {
  // Apply transformation to domain bounds
  const transformedMin = applyTransformation(minDepartures, transformation);
  const transformedMax = applyTransformation(maxDepartures, transformation);

  // Always use full [0, 1] color range for Viridis interpolator
  const scale = scaleSequential(interpolateViridis).domain([0, 1]);

  return (departures: number): string => {
    // Clamp value to domain range before transformation
    const clampedValue = Math.max(minDepartures, Math.min(maxDepartures, departures));
    // Apply transformation to the input value
    const transformedValue = applyTransformation(clampedValue, transformation);
    // Normalize to [0, 1] range to use full color spectrum
    const normalized = normalizeValue(transformedValue, transformedMin, transformedMax);
    return scale(normalized);
  };
}

/**
 * Get Viridis color for a specific normalized value (0-1)
 *
 * Useful when you've already normalized your data or want direct control
 * over the interpolation parameter.
 *
 * @param t - Normalized value between 0 and 1
 * @returns Hex color string
 *
 * @example
 * ```typescript
 * const purple = getViridisColor(0);    // "#440154" (low)
 * const green = getViridisColor(0.5);   // "#21918c" (medium)
 * const yellow = getViridisColor(1);    // "#fde725" (high)
 * ```
 */
export function getViridisColor(t: number): string {
  // Clamp t to [0, 1]
  const clampedT = Math.max(0, Math.min(1, t));
  return interpolateViridis(clampedT);
}

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
    const p2Index = Math.max(0, Math.floor(sorted.length * 0.02));
    const p98Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.98));

    return {
      minDepartures: sorted[p2Index] ?? 0,
      maxDepartures: sorted[p98Index] ?? 0,
    };
  }

  return {
    minDepartures: Math.min(...departures),
    maxDepartures: Math.max(...departures),
  };
}

/**
 * Viridis color scale constants
 * Useful for legends, documentation, or reference
 */
export const VIRIDIS_COLORS = {
  /** Purple (low values) */
  MIN: '#440154',
  /** Blue-purple (25%) */
  QUARTER: '#31688e',
  /** Teal (50%) */
  MIDDLE: '#21918c',
  /** Green-yellow (75%) */
  THREE_QUARTER: '#5ec962',
  /** Yellow (high values) */
  MAX: '#fde725',
} as const;
