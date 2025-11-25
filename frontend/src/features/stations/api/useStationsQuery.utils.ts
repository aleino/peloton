import type { StationsListResponseBody } from '@peloton/shared';
import type {
  FlattenedStationFeatureCollection,
  FlattenedStationFeature,
} from './useStationsQuery';

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

            // Legacy field - kept for backwards compatibility
            totalDepartures: tripStatistics.departures.tripsCount,
          }),
        },
      };
    }),
  };
}
