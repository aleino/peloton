import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStationsQuery } from './useStationsQuery';
import { fetchStations } from './stationsApi';
import { stationsQueryKeys } from './stationsQueryKeys';
import type { StationsListResponseBody } from '@peloton/shared';
import type { ReactNode } from 'react';

// Mock the API client functions
vi.mock('./stationsApi', () => ({
  fetchStations: vi.fn(),
}));

describe('useStationsQuery', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  const mockGeoJSONResponse: StationsListResponseBody = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: '001',
        geometry: {
          type: 'Point',
          coordinates: [24.9384, 60.1699],
        },
        properties: {
          stationId: '001',
          name: 'Test Station',
          tripStatistics: {
            departures: {
              tripsCount: 1523,
              durationSecondsAvg: 895,
              distanceMetersAvg: 2340,
            },
            returns: {
              tripsCount: 1489,
              durationSecondsAvg: 920,
              distanceMetersAvg: 2380,
            },
          },
        },
      },
    ],
  };

  const mockGeoJSONWithoutStatistics: StationsListResponseBody = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: '002',
        geometry: {
          type: 'Point',
          coordinates: [24.9414, 60.1689],
        },
        properties: {
          stationId: '002',
          name: 'Station Without Stats',
        },
      },
    ],
  };

  it('should return loading state initially', () => {
    vi.mocked(fetchStations).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useStationsQuery(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should return data on success', async () => {
    vi.mocked(fetchStations).mockResolvedValue(mockGeoJSONResponse);

    const { result } = renderHook(() => useStationsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.type).toBe('FeatureCollection');
    expect(result.current.data?.features).toHaveLength(1);
    expect(result.current.data?.features[0].properties.stationId).toBe('001');
    expect(result.current.data?.features[0].properties.name).toBe('Test Station');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return error on failure', async () => {
    const error = new Error('Failed to fetch stations');
    vi.mocked(fetchStations).mockRejectedValue(error);

    const { result } = renderHook(() => useStationsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should respect enabled option', async () => {
    vi.mocked(fetchStations).mockResolvedValue(mockGeoJSONResponse);

    const { result } = renderHook(() => useStationsQuery({ enabled: false }), {
      wrapper,
    });

    // Should not fetch when disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(fetchStations).not.toHaveBeenCalled();
  });

  it('should call fetchStations with bounds parameter', async () => {
    const bounds = '24.9,60.15,25.0,60.20';
    vi.mocked(fetchStations).mockResolvedValue(mockGeoJSONResponse);

    const { result } = renderHook(() => useStationsQuery({ bounds }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchStations).toHaveBeenCalledWith({ bounds });
  });

  it('should use correct query key', async () => {
    vi.mocked(fetchStations).mockResolvedValue(mockGeoJSONResponse);

    const bounds = '24.9,60.15,25.0,60.20';

    renderHook(() => useStationsQuery({ bounds }), { wrapper });

    await waitFor(() => {
      const queryData = queryClient.getQueryData(stationsQueryKeys.list(bounds));
      expect(queryData).toBeDefined();
    });
  });

  it('should trigger refetch when query key changes', async () => {
    vi.mocked(fetchStations).mockResolvedValue(mockGeoJSONResponse);

    const { rerender, result } = renderHook(({ bounds }) => useStationsQuery({ bounds }), {
      wrapper,
      initialProps: { bounds: '24.9,60.15,25.0,60.20' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchStations).toHaveBeenCalledTimes(1);

    // Change bounds
    rerender({ bounds: '25.0,60.20,25.1,60.25' });

    await waitFor(() => expect(fetchStations).toHaveBeenCalledTimes(2));
  });

  describe('flattened metrics', () => {
    it('should flatten all departure metrics', async () => {
      vi.mocked(fetchStations).mockResolvedValue(mockGeoJSONResponse);

      const { result } = renderHook(() => useStationsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const feature = result.current.data?.features[0];
      expect(feature?.properties.departuresCount).toBe(1523);
      expect(feature?.properties.departuresDurationAvg).toBe(895);
      expect(feature?.properties.departuresDistanceAvg).toBe(2340);
    });

    it('should flatten all return metrics', async () => {
      vi.mocked(fetchStations).mockResolvedValue(mockGeoJSONResponse);

      const { result } = renderHook(() => useStationsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const feature = result.current.data?.features[0];
      expect(feature?.properties.returnsCount).toBe(1489);
      expect(feature?.properties.returnsDurationAvg).toBe(920);
      expect(feature?.properties.returnsDistanceAvg).toBe(2380);
    });

    it('should preserve original tripStatistics object', async () => {
      vi.mocked(fetchStations).mockResolvedValue(mockGeoJSONResponse);

      const { result } = renderHook(() => useStationsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const feature = result.current.data?.features[0];
      expect(feature?.properties.tripStatistics).toEqual({
        departures: {
          tripsCount: 1523,
          durationSecondsAvg: 895,
          distanceMetersAvg: 2340,
        },
        returns: {
          tripsCount: 1489,
          durationSecondsAvg: 920,
          distanceMetersAvg: 2380,
        },
      });
    });

    it('should maintain backwards compatibility with totalDepartures', async () => {
      vi.mocked(fetchStations).mockResolvedValue(mockGeoJSONResponse);

      const { result } = renderHook(() => useStationsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const feature = result.current.data?.features[0];
      expect(feature?.properties.totalDepartures).toBe(1523);
      expect(feature?.properties.totalDepartures).toBe(feature?.properties.departuresCount);
    });

    it('should handle missing tripStatistics gracefully', async () => {
      vi.mocked(fetchStations).mockResolvedValue(mockGeoJSONWithoutStatistics);

      const { result } = renderHook(() => useStationsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const feature = result.current.data?.features[0];
      expect(feature?.properties.tripStatistics).toBeUndefined();
      expect(feature?.properties.departuresCount).toBeUndefined();
      expect(feature?.properties.departuresDurationAvg).toBeUndefined();
      expect(feature?.properties.departuresDistanceAvg).toBeUndefined();
      expect(feature?.properties.returnsCount).toBeUndefined();
      expect(feature?.properties.returnsDurationAvg).toBeUndefined();
      expect(feature?.properties.returnsDistanceAvg).toBeUndefined();
      expect(feature?.properties.totalDepartures).toBeUndefined();
    });
  });
});
