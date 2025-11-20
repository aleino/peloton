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
        geometry: {
          type: 'Point',
          coordinates: [24.9384, 60.1699],
        },
        properties: {
          stationId: '001',
          name: 'Kaivopuisto',
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

    expect(result.current.data).toEqual(mockGeoJSONResponse);
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

    expect(fetchStations).toHaveBeenCalledWith({ bounds, format: 'geojson' });
  });

  it('should call fetchStations with format parameter', async () => {
    vi.mocked(fetchStations).mockResolvedValue(mockGeoJSONResponse);

    const { result } = renderHook(() => useStationsQuery({ format: 'json' }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchStations).toHaveBeenCalledWith({ format: 'json' });
  });

  it('should use correct query key', async () => {
    vi.mocked(fetchStations).mockResolvedValue(mockGeoJSONResponse);

    const bounds = '24.9,60.15,25.0,60.20';
    const format = 'geojson';

    renderHook(() => useStationsQuery({ bounds, format }), { wrapper });

    await waitFor(() => {
      const queryData = queryClient.getQueryData(stationsQueryKeys.list(bounds, format));
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

  it('should use default format of geojson', async () => {
    vi.mocked(fetchStations).mockResolvedValue(mockGeoJSONResponse);

    renderHook(() => useStationsQuery(), { wrapper });

    await waitFor(() => expect(fetchStations).toHaveBeenCalled());

    expect(fetchStations).toHaveBeenCalledWith({ format: 'geojson' });
  });
});
