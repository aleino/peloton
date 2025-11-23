import { useQuery } from '@tanstack/react-query';
import { fetchStations } from './stationsApi';
import { stationsQueryKeys } from './stationsQueryKeys';
import type { StationsListResponseBody } from '@peloton/shared';

/**
 * Options for useStationsQuery hook
 */
interface useStationsQueryOptions {
  bounds?: string;
  enabled?: boolean;
}

/**
 * Hook to fetch all stations as GeoJSON
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

  return useQuery<StationsListResponseBody>({
    queryKey: stationsQueryKeys.list(bounds),
    queryFn: () => fetchStations({ ...(bounds && { bounds }) }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};
