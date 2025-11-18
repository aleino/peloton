import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client configuration for Peloton
 *
 * Configured for optimal caching and refetching behavior for a map-based
 * data visualization application.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is static - keep fresh indefinitely
      staleTime: Infinity,

      // Cache data indefinitely (static data doesn't change)
      gcTime: Infinity,

      // Retry failed requests 2 times with exponential backoff
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Don't refetch on window focus (data is static)
      refetchOnWindowFocus: false,

      // Don't refetch on mount (data is static)
      refetchOnMount: false,

      // Refetch on network reconnect (recover from network failures)
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

/**
 * Query key conventions for cache management:
 *
 * Stations:
 * - ['stations'] - List of all stations
 * - ['stations', stationId] - Single station detail
 *
 * Routes:
 * - ['routes'] - List of all routes
 * - ['routes', routeId] - Single route detail
 *
 * Trips:
 * - ['trips', filters] - Filtered trip list
 *
 * Analytics:
 * - ['analytics', filters] - Filtered analytics data
 *
 * Use consistent key patterns for proper cache invalidation and refetching.
 */
