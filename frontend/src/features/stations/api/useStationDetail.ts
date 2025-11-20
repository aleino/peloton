import { useQuery } from '@tanstack/react-query';
import { fetchStationDetail } from './stationsApi';
import { stationsQueryKeys } from './stationsQueryKeys';
import type { StationsGetResponseBody } from '@peloton/shared';

/**
 * Options for useStationDetail hook
 */
interface UseStationDetailOptions {
  stationId: string;
  enabled?: boolean;
}

/**
 * Hook to fetch detailed station information
 *
 * @param options - Query options including station ID
 * @returns React Query result with station detail data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useStationDetail({
 *   stationId: '001',
 *   enabled: isOpen // Only fetch when panel is open
 * });
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return (
 *   <StationPanel station={data}>
 *     <Statistics data={data.statistics} />
 *   </StationPanel>
 * );
 * ```
 */
export const useStationDetail = (options: UseStationDetailOptions) => {
  const { stationId, enabled = true } = options;

  return useQuery<StationsGetResponseBody>({
    queryKey: stationsQueryKeys.detail(stationId),
    queryFn: () => fetchStationDetail(stationId),
    enabled: enabled && !!stationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};
