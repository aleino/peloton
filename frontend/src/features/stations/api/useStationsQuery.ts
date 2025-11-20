import { useQuery } from '@tanstack/react-query';
import { fetchStations } from './stationsApi';
import { stationsQueryKeys } from './stationsQueryKeys';
import type { StationsListResponseBody } from '@peloton/shared';

/**
 * Options for useStationsQuery hook
 */
interface useStationsQueryOptions {
  bounds?: string;
  format?: 'geojson' | 'json';
  enabled?: boolean;
}

/**
 * Hook to fetch all stations
 *
 * @param options - Query options
 * @returns React Query result with stations data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useStationsQuery({
 *   bounds: '24.9,60.15,25.0,60.20',
 *   format: 'geojson'
 * });
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return <MapView stations={data} />;
 * ```
 */
export const useStationsQuery = (options: useStationsQueryOptions = {}) => {
  const { bounds, format = 'geojson', enabled = true } = options;

  return useQuery<StationsListResponseBody>({
    queryKey: stationsQueryKeys.list(bounds, format),
    queryFn: () => fetchStations({ ...(bounds && { bounds }), format }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};
