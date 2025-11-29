import { useQuery } from '@tanstack/react-query';
import { fetchStations } from './stationsApi';
import { stationsQueryKeys } from './stationsQueryKeys';
import { flattenStationMetrics } from './useStationsQuery.utils';

/**
 * Options for useStationsQuery hook
 */
interface useStationsQueryOptions {
  bounds?: string;
  enabled?: boolean;
}

/**
 * Flattened station feature properties with all metrics at top level for Mapbox expressions
 */
export interface FlattenedStationFeatureProperties {
  stationId: string;
  name: string;
  tripStatistics?: {
    departures: {
      tripsCount: number;
      durationSecondsAvg: number;
      distanceMetersAvg: number;
    };
    returns: {
      tripsCount: number;
      durationSecondsAvg: number;
      distanceMetersAvg: number;
    };
  };

  // Flattened metrics for Mapbox expressions
  // Departures (outgoing trips)
  departuresCount?: number;
  departuresDurationAvg?: number;
  departuresDistanceAvg?: number;

  // Returns (incoming trips)
  returnsCount?: number;
  returnsDurationAvg?: number;
  returnsDistanceAvg?: number;

  /**
   * Relative difference metrics (range: -1.0 to +1.0)
   *
   * Calculated as: (departures - returns) / (departures + returns)
   *
   * - Positive values (+1.0): More departures (source station)
   * - Negative values (-1.0): More arrivals (destination station)
   * - Near zero (0.0): Balanced station
   */
  diffCount?: number;
  diffDurationAvg?: number;
  diffDistanceAvg?: number;

  // Legacy field - kept for backwards compatibility
  totalDepartures?: number;
}

/**
 * Flattened station feature for Mapbox expressions
 */
export interface FlattenedStationFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: FlattenedStationFeatureProperties;
}

/**
 * Flattened station feature collection for Mapbox
 */
export interface FlattenedStationFeatureCollection {
  type: 'FeatureCollection';
  features: FlattenedStationFeature[];
}

const VALID_ID_MAX_LENGTH = 5;

/**
 * Hook to fetch all stations as GeoJSON with flattened metrics for Mapbox
 *
 * Transforms the backend data by adding flat metric fields to each feature's
 * properties for easy access in Mapbox GL expressions. This keeps backend data clean
 * while providing the structure needed for map visualization.
 *
 * Flattened fields:
 * - departuresCount, departuresDurationAvg, departuresDistanceAvg
 * - returnsCount, returnsDurationAvg, returnsDistanceAvg
 *
 * @param options - Query options
 * @returns React Query result with stations GeoJSON data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useStationsQuery({
 *   bounds: '24.9,60.15,25.0,60.20'
 * });
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return <MapView stations={data} />;
 * ```
 */
export const useStationsQuery = (options: useStationsQueryOptions = {}) => {
  const { bounds, enabled = true } = options;

  return useQuery<FlattenedStationFeatureCollection>({
    queryKey: stationsQueryKeys.list(bounds),
    queryFn: async () => {
      const data = await fetchStations({ ...(bounds && { bounds }) });

      // TODO: Move to backend data pipeline
      const filteredData = {
        ...data,
        // Remove Honkasuo station with invalid ID
        features: data.features.filter((f) => f.id.length < VALID_ID_MAX_LENGTH),
      };

      return flattenStationMetrics(filteredData);
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};
