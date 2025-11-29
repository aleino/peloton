import { scaleLinear, scaleLog, scalePow, scaleQuantile, scaleDiverging } from 'd3-scale';
import { interpolateBrBG, interpolateViridis } from 'd3-scale-chromatic';
import { extent } from 'd3-array';
import type { ExpressionSpecification } from 'mapbox-gl';
import { calculateJenksBreaks } from './jenks/calculateJenksBreaks';

const NUM_STOPS = 7;
const DEFAULT_COLOR = '#cccccc';
const NEUTRAL_COLOR = '#f7f7f7';

/**
 * Validate and filter numeric values
 */
function getValidValues(values: number[]): number[] {
  return values.filter((v) => Number.isFinite(v) && v !== undefined);
}

/**
 * Generic function to create Mapbox interpolate expression from D3 scale
 */
function createInterpolateExpression(
  scale: (value: number) => number,
  colorInterpolator: (t: number) => string,
  inputValue: ExpressionSpecification
): ExpressionSpecification {
  const stops = Array.from({ length: NUM_STOPS }, (_, i) => {
    const t = i / (NUM_STOPS - 1);
    const value = scale(t);
    const color = colorInterpolator(t);
    return [value, color];
  }).flat();

  return ['interpolate', ['linear'], inputValue, ...stops] as ExpressionSpecification;
}

/**
 * Calculate min and max departure counts from station data
 *
 * Helper function to extract departure range from GeoJSON features.
 *
 * @param stations - Array of station features with totalDepartures in properties
 * @returns Object with min and max departure counts
 *
 * @example
 * ```typescript
 * const { minDepartures, maxDepartures } = getDepartureRange(stationFeatures);
 * const colorScale = createViridisScale(minDepartures, maxDepartures);
 * ```
 */
export function getDepartureRange(stations: Array<{ properties: { totalDepartures?: number } }>): {
  minDepartures: number;
  maxDepartures: number;
} {
  const departures = getValidValues(stations.map((s) => s.properties.totalDepartures ?? 0));

  if (departures.length === 0) {
    return { minDepartures: 0, maxDepartures: 0 };
  }

  const [minDepartures, maxDepartures] = extent(departures);
  return {
    minDepartures: minDepartures ?? 0,
    maxDepartures: maxDepartures ?? 0,
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
  if (minValue === maxValue) {
    return interpolateViridis(0.5);
  }

  const scale = scaleLinear().domain([0, 1]).range([minValue, maxValue]).clamp(true);

  return createInterpolateExpression((t) => scale(t), interpolateViridis, inputValue);
}

/**
 * Create a Mapbox interpolate expression for square root scale
 *
 * Uses D3's scalePow with exponent 0.5 (square root) to map values to colors from the Viridis color scale.
 * Useful for data with moderate right skew - compresses high values more than linear but less than logarithmic.
 * Provides better visual distribution than linear for count data while being less aggressive than log.
 *
 * @param minValue - Minimum value in the dataset
 * @param maxValue - Maximum value in the dataset
 * @param inputValue - Mapbox expression to use as input (e.g., ['get', 'totalDepartures'])
 * @returns Mapbox interpolate expression for square root color mapping
 */
export function createSqrtColorExpression(
  minValue: number,
  maxValue: number,
  inputValue: ExpressionSpecification
): string | ExpressionSpecification {
  if (minValue === maxValue) {
    return interpolateViridis(0.5);
  }

  const scale = scalePow().exponent(0.5).domain([0, 1]).range([minValue, maxValue]).clamp(true);

  return createInterpolateExpression((t) => scale(t), interpolateViridis, inputValue);
}

/**
 * Create a Mapbox interpolate expression for logarithmic scale
 *
 * Uses D3's scaleLog to map values to colors from the Viridis color scale.
 * Useful for data with exponential distributions or wide ranges.
 * Small values get more color resolution than large values.
 * Note: Uses Math.max(minValue, 1) to ensure log scale compatibility (must be > 0).
 *
 * @param minValue - Minimum value in the dataset (will be clamped to minimum of 1)
 * @param maxValue - Maximum value in the dataset
 * @param inputValue - Mapbox expression to use as input (e.g., ['get', 'totalDepartures'])
 * @returns Mapbox interpolate expression for logarithmic color mapping
 */
export function createLogColorExpression(
  minValue: number,
  maxValue: number,
  inputValue: ExpressionSpecification
): string | ExpressionSpecification {
  if (minValue === maxValue) {
    return interpolateViridis(0.5);
  }

  const safeMin = Math.max(minValue, 1);
  // Create a log scale that maps from data domain to [0,1] color position
  // Then invert it to get data values for each color stop
  const logScale = scaleLog().domain([safeMin, maxValue]).range([0, 1]).clamp(true);

  return createInterpolateExpression((t) => logScale.invert(t), interpolateViridis, inputValue);
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
  const validValues = getValidValues(values);

  if (validValues.length === 0) {
    return DEFAULT_COLOR;
  }

  const [minVal, maxVal] = extent(validValues);
  if (validValues.length === 1 || minVal === maxVal) {
    return interpolateViridis(0.5);
  }

  const sorted = [...validValues].sort((a, b) => a - b);

  const colors = Array.from({ length: NUM_STOPS }, (_, i) =>
    interpolateViridis(i / (NUM_STOPS - 1))
  );
  const scale = scaleQuantile<string>().domain(sorted).range(colors);

  return [
    'step',
    inputValue,
    colors[0]!,
    ...scale.quantiles().flatMap((threshold, i) => [threshold, colors[i + 1]!]),
  ] as ExpressionSpecification;
}

/**
 * Create a Mapbox step expression for Jenks (natural breaks) scale
 *
 * Uses Jenks natural breaks optimization to find "natural" groupings in data.
 * Minimizes within-class variance and maximizes between-class variance,
 * creating visually distinct color bins that follow the data's inherent structure.
 *
 * This implementation uses:
 * - Stratified sampling for 10-20x speedup on large datasets
 * - Enhanced caching with fingerprinting for 80%+ cache hit rate
 * - Optimized for real-time interactive visualization
 *
 * @param values - Array of all values in the dataset
 * @param inputValue - Mapbox expression to use as input (e.g., ['get', 'totalDepartures'])
 * @param numClasses - Number of classes to create (default: 11 for color stops)
 * @returns Mapbox step expression for Jenks color mapping
 *
 * @example
 * ```typescript
 * const expression = createJenksColorExpression(
 *   stationValues,
 *   ['get', 'totalDepartures'],
 *   11
 * );
 * // Returns: ['step', ['get', 'totalDepartures'], color0, break1, color1, ...]
 * ```
 */
export function createJenksColorExpression(
  values: number[],
  inputValue: ExpressionSpecification,
  numClasses: number = NUM_STOPS
): string | ExpressionSpecification {
  const validValues = getValidValues(values);

  if (validValues.length === 0) {
    return DEFAULT_COLOR;
  }

  const [minVal, maxVal] = extent(validValues);
  if (validValues.length === 1 || minVal === maxVal) {
    return interpolateViridis(0.5);
  }

  const sorted = [...validValues].sort((a, b) => a - b);
  console.log('sorter', sorted);

  // Calculate Jenks breaks using optimized algorithm
  // (with sampling and caching)
  const breaks = calculateJenksBreaks(sorted, numClasses);

  // Generate colors for each class
  const colors = Array.from({ length: numClasses }, (_, i) =>
    interpolateViridis(i / (numClasses - 1))
  );

  // Build Mapbox step expression
  // Format: ['step', input, color0, break1, color1, break2, color2, ...]
  const stepExpression: ExpressionSpecification = [
    'step',
    inputValue,
    colors[0]!, // Base color (for values < first break)
    ...breaks.slice(1, -1).flatMap((breakValue, i) => [breakValue, colors[i + 1]!]),
  ];

  return stepExpression;
}

/**
 * Create a Mapbox color expression using D3 diverging scale (RdBu)
 *
 * Diverging scales are ideal for data with a meaningful midpoint (zero),
 * showing both negative and positive deviations from that center point.
 *
 * Uses D3's scaleDiverging with interpolateRdBu:
 * - Red: Negative values (more arrivals)
 * - White: Zero (neutral/balanced)
 * - Blue: Positive values (more departures)
 *
 * The scale uses symmetric ranges around zero to ensure the midpoint
 * (white) represents exactly zero, even with asymmetric data.
 *
 * @param values - Array of numeric values (can include negative, zero, positive)
 * @param inputValueExpression - Mapbox expression that provides the value to map
 * @returns Mapbox expression for diverging color mapping
 *
 * @example
 * ```typescript
 * // For difference data ranging from -0.8 to +0.6
 * const expression = createDivergingColorExpression(
 *   [-0.8, -0.5, 0, 0.3, 0.6],
 *   ['get', 'diffCount']
 * );
 * ```
 */
export function createDivergingColorExpression(
  values: number[],
  inputValueExpression: ExpressionSpecification
): ExpressionSpecification | string {
  const validValues = getValidValues(values);

  if (validValues.length === 0) {
    return DEFAULT_COLOR;
  }

  const [minValue, maxValue] = extent(validValues);
  if (minValue === undefined || maxValue === undefined || minValue === maxValue) {
    return NEUTRAL_COLOR;
  }

  const maxAbsValue = Math.max(Math.abs(minValue), Math.abs(maxValue));
  const scale = scaleDiverging(interpolateBrBG).domain([-maxAbsValue, 0, maxAbsValue]).clamp(true);

  const stops = Array.from({ length: NUM_STOPS }, (_, i) => {
    const t = i / (NUM_STOPS - 1);
    const value = -maxAbsValue + t * (2 * maxAbsValue);
    return [value, scale(value)];
  }).flat();

  return ['interpolate', ['linear'], inputValueExpression, ...stops] as ExpressionSpecification;
}
