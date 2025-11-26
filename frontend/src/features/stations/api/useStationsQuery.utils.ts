import type { StationsListResponseBody } from '@peloton/shared';
import type {
  FlattenedStationFeatureCollection,
  FlattenedStationFeature,
} from './useStationsQuery';

/**
 * Calculate relative difference between two values
 *
 * Formula: (a - b) / (a + b)
 *
 * Returns:
 * - +1.0 when only a exists (100% a)
 * - 0.0 when a equals b (balanced)
 * - -1.0 when only b exists (100% b)
 * - 0 when both are zero or undefined
 *
 * @param a - First value (e.g., departures)
 * @param b - Second value (e.g., arrivals)
 * @returns Relative difference in range [-1.0, +1.0], or 0 for edge cases
 */
export function calculateRelativeDifference(a: number | undefined, b: number | undefined): number {
  // Handle undefined values
  const valueA = a ?? 0;
  const valueB = b ?? 0;

  // Handle zero-sum case (both zero or no data)
  const sum = valueA + valueB;
  if (sum === 0) {
    return 0;
  }

  // Calculate relative difference
  const diff = valueA - valueB;
  return diff / sum;
}

/**
 * Flattens station data by adding top-level metric properties for Mapbox expressions
 *
 * Transforms nested tripStatistics into flat properties for efficient access in
 * Mapbox GL expressions. This keeps backend data clean while providing the
 * structure needed for map visualization.
 *
 * @param data - Station GeoJSON data from the API
 * @returns Flattened station feature collection with metrics at top level
 *
 * @example
 * ```typescript
 * const apiData = await fetchStations();
 * const flattened = flattenStationMetrics(apiData);
 * // Now accessible: feature.properties.departuresCount
 * ```
 */
export function flattenStationMetrics(
  data: StationsListResponseBody
): FlattenedStationFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: data.features.map((feature): FlattenedStationFeature => {
      const { tripStatistics } = feature.properties;

      return {
        type: 'Feature' as const,
        id: feature.id,
        geometry: feature.geometry,
        properties: {
          stationId: feature.properties.stationId,
          name: feature.properties.name,
          ...(tripStatistics && { tripStatistics }),

          // Flatten departure metrics
          ...(tripStatistics && {
            departuresCount: tripStatistics.departures.tripsCount,
            departuresDurationAvg: tripStatistics.departures.durationSecondsAvg,
            departuresDistanceAvg: tripStatistics.departures.distanceMetersAvg,

            // Flatten return metrics
            returnsCount: tripStatistics.returns.tripsCount,
            returnsDurationAvg: tripStatistics.returns.durationSecondsAvg,
            returnsDistanceAvg: tripStatistics.returns.distanceMetersAvg,

            // Calculate difference metrics
            diffCount: calculateRelativeDifference(
              tripStatistics.departures.tripsCount,
              tripStatistics.returns.tripsCount
            ),
            diffDurationAvg: calculateRelativeDifference(
              tripStatistics.departures.durationSecondsAvg,
              tripStatistics.returns.durationSecondsAvg
            ),
            diffDistanceAvg: calculateRelativeDifference(
              tripStatistics.departures.distanceMetersAvg,
              tripStatistics.returns.distanceMetersAvg
            ),

            // Legacy field - kept for backwards compatibility
            totalDepartures: tripStatistics.departures.tripsCount,
          }),
        },
      };
    }),
  };
}
