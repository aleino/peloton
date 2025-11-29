/**
 * Jenks Natural Breaks Optimization
 *
 * This module implements the Fisher-Jenks algorithm for finding optimal
 * break points in continuous data. It's particularly useful for creating
 * choropleth maps with data-driven color scales.
 *
 * @module jenks
 */

export { calculateJenks } from './calculateJenks';
export { calculateVariance } from './calculateVariance';
export {
  calculateJenksWithSampling,
  stratifiedSample,
  randomSample,
  adaptiveSample,
  type SamplingOptions,
} from './calculateJenksWithSampling';
export { calculateJenksBreaks, getCacheStats, clearJenksCache } from './calculateJenksBreaks';
