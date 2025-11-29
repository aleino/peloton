/**
 * Calculate variance for a segment of sorted values
 *
 * Uses a two-pass algorithm for numerical stability:
 * 1. First pass: calculate mean
 * 2. Second pass: calculate variance from mean
 *
 * @param values - Sorted array of numeric values
 * @param start - Start index (inclusive)
 * @param end - End index (inclusive)
 * @returns Variance of the segment, or 0 for invalid ranges
 *
 * @example
 * const values = [1, 2, 3, 4, 5];
 * const variance = calculateVariance(values, 0, 4); // variance of all values
 */
export function calculateVariance(values: number[], start: number, end: number): number {
  // Validate inputs
  if (start > end || start < 0 || end >= values.length) {
    return 0;
  }

  const segment = values.slice(start, end + 1);

  // Edge cases: empty or single-value segments have zero variance
  if (segment.length === 0 || segment.length === 1) {
    return 0;
  }

  // Two-pass algorithm for numerical stability
  // Pass 1: Calculate mean
  const mean = segment.reduce((sum, v) => sum + v, 0) / segment.length;

  // Pass 2: Calculate variance from mean
  const variance = segment.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);

  return variance;
}
