import { scaleLinear, scaleLog, scaleQuantile, scaleDiverging } from 'd3-scale';
import { interpolateBrBG, interpolateViridis } from 'd3-scale-chromatic';
import { extent, quantileSorted } from 'd3-array';
import type { ExpressionSpecification } from 'mapbox-gl';

const NUM_STOPS = 11;
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
  stations: Array<{ properties: { totalDepartures?: number } }>,
  usePercentiles = false
): { minDepartures: number; maxDepartures: number } {
  const departures = getValidValues(stations.map((s) => s.properties.totalDepartures ?? 0));

  if (departures.length === 0) {
    return { minDepartures: 0, maxDepartures: 0 };
  }

  if (usePercentiles) {
    const sorted = [...departures].sort((a, b) => a - b);
    return {
      minDepartures: quantileSorted(sorted, 0.05) ?? 0,
      maxDepartures: quantileSorted(sorted, 0.95) ?? 0,
    };
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
  if (minValue === maxValue) {
    return interpolateViridis(0.5);
  }

  const scale = scaleLinear().domain([0, 1]).range([minValue, maxValue]).clamp(true);

  return createInterpolateExpression((t) => scale(t), interpolateViridis, inputValue);
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
  if (minValue === maxValue) {
    return interpolateViridis(0.5);
  }

  const safeMin = Math.max(minValue, 1);
  const scale = scaleLog().domain([0, 1]).range([safeMin, maxValue]).clamp(true);

  return createInterpolateExpression((t) => scale(t), interpolateViridis, inputValue);
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
  const validValues = getValidValues(values);

  if (validValues.length === 0) {
    return DEFAULT_COLOR;
  }

  const [minVal, maxVal] = extent(validValues);
  if (validValues.length === 1 || minVal === maxVal) {
    return interpolateViridis(0.5);
  }

  const sorted = [...validValues].sort((a, b) => a - b);
  const p5Value = quantileSorted(sorted, 0.05) ?? minVal ?? 0;
  const p95Value = quantileSorted(sorted, 0.95) ?? maxVal ?? 0;
  const trimmed = sorted.filter((v) => v >= p5Value && v <= p95Value);

  const colors = Array.from({ length: NUM_STOPS }, (_, i) =>
    interpolateViridis(i / (NUM_STOPS - 1))
  );
  const scale = scaleQuantile<string>().domain(trimmed).range(colors);

  return [
    'step',
    inputValue,
    colors[0]!,
    ...scale.quantiles().flatMap((threshold, i) => [threshold, colors[i + 1]!]),
  ] as ExpressionSpecification;
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
  const sortedValues = [...validValues].sort((a, b) => a - b);

  // Use percentiles to trim extreme outliers (5th and 95th percentiles)
  const p5Value = quantileSorted(sortedValues, 0.05) ?? minValue;
  const p95Value = quantileSorted(sortedValues, 0.95) ?? maxValue;

  const maxAbsValue = Math.max(Math.abs(p5Value), Math.abs(p95Value));
  const scale = scaleDiverging(interpolateBrBG).domain([-maxAbsValue, 0, maxAbsValue]).clamp(true);

  const stops = Array.from({ length: NUM_STOPS }, (_, i) => {
    const t = i / (NUM_STOPS - 1);
    const value = -maxAbsValue + t * (2 * maxAbsValue);
    return [value, scale(value)];
  }).flat();

  return ['interpolate', ['linear'], inputValueExpression, ...stops] as ExpressionSpecification;
}
