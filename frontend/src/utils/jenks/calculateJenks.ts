import { calculateVariance } from './calculateVariance';

/**
 * Calculate natural breaks (Jenks) for the given values
 *
 * Uses Fisher-Jenks algorithm with dynamic programming to find
 * optimal break points that minimize within-class variance.
 *
 * The algorithm works by:
 * 1. Pre-computing variance for all possible segments
 * 2. Using dynamic programming to find optimal k-class partitioning
 * 3. Backtracking to extract the break points
 *
 * Complexity: O(n²k) time, O(nk) space
 * where n = number of values, k = number of classes
 *
 * @param values - Array of numeric values to classify
 * @param numClasses - Number of classes to create (default: 7)
 * @returns Array of break points (length = numClasses + 1, includes min and max)
 *
 * @throws {Error} If numClasses is less than 1
 * @throws {Error} If values contain non-finite numbers
 *
 * @example
 * const breaks = calculateJenks([1, 2, 5, 7, 10, 15, 20], 3);
 * // Returns: [1, 5, 10, 20] (3 classes: [1-5), [5-10), [10-20])
 *
 * @example
 * // With real bike-sharing data
 * const departures = stations.map(s => s.properties.totalDepartures);
 * const breaks = calculateJenks(departures, 7);
 */
export function calculateJenks(values: number[], numClasses: number = 7): number[] {
  // Input validation
  if (numClasses < 1) {
    throw new Error('Number of classes must be at least 1');
  }

  if (values.length === 0) {
    return [];
  }

  // Validate all values are finite numbers
  if (values.some((v) => !Number.isFinite(v))) {
    throw new Error('All values must be finite numbers');
  }

  // Edge case: single value
  if (values.length === 1) {
    return [values[0]!, values[0]!];
  }

  // Sort values (Jenks requires sorted data)
  const sorted = [...values].sort((a, b) => a - b);

  // Edge case: all values are identical
  if (sorted[0] === sorted[sorted.length - 1]) {
    return Array(numClasses + 1).fill(sorted[0]);
  }

  // Edge case: more classes requested than unique values
  if (numClasses >= sorted.length - 1) {
    const unique = [...new Set(sorted)].sort((a, b) => a - b);
    return unique;
  }

  const n = sorted.length;

  // Step 1: Build variance matrix
  // varianceMatrix[i][j] = variance of values[i..j]
  const varianceMatrix: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      varianceMatrix[i]![j] = calculateVariance(sorted, i, j);
    }
  }

  // Step 2: Dynamic programming
  // dp[k][i] = minimum variance for k classes using first i+1 values
  const dp: number[][] = Array(numClasses)
    .fill(0)
    .map(() => Array(n).fill(Infinity));

  // backtrack[k][i] = index of last value in previous class
  // when optimally partitioning first i+1 values into k classes
  const backtrack: number[][] = Array(numClasses)
    .fill(0)
    .map(() => Array(n).fill(0));

  // Base case: 1 class (all values in one class)
  for (let i = 0; i < n; i++) {
    dp[0]![i] = varianceMatrix[0]![i]!;
  }

  // Fill DP table
  for (let k = 1; k < numClasses; k++) {
    for (let i = k; i < n; i++) {
      // Try all possible split points for the last class
      for (let j = k - 1; j < i; j++) {
        // Total variance = variance of first k classes up to j
        //                  + variance of last class from j+1 to i
        const variance = dp[k - 1]![j]! + varianceMatrix[j + 1]![i]!;

        if (variance < dp[k]![i]!) {
          dp[k]![i] = variance;
          backtrack[k]![i] = j;
        }
      }
    }
  }

  // Step 3: Backtrack to get break points
  const breaks: number[] = [sorted[n - 1]!]; // Start with max value
  let idx = n - 1;

  // Walk backwards through the backtrack matrix
  for (let k = numClasses - 1; k > 0; k--) {
    idx = backtrack[k]![idx]!;
    breaks.unshift(sorted[idx]!);
  }

  // Add minimum value at the start
  breaks.unshift(sorted[0]!);

  return breaks;
}
