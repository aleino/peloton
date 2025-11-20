/**
 * Query key factory for stations queries
 * Provides consistent query keys for React Query
 */

export const stationsQueryKeys = {
  all: ['stations'] as const,
  lists: () => [...stationsQueryKeys.all, 'list'] as const,
  list: (bounds?: string, format?: 'geojson' | 'json') =>
    [...stationsQueryKeys.lists(), { bounds, format }] as const,
  details: () => [...stationsQueryKeys.all, 'detail'] as const,
  detail: (stationId: string) => [...stationsQueryKeys.details(), stationId] as const,
};
