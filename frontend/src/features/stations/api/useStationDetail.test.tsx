import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStationDetail } from './useStationDetail';
import { fetchStationDetail } from './stationsApi';
import { stationsQueryKeys } from './stationsQueryKeys';
import type { StationsGetResponseBody } from '@peloton/shared';
import type { ReactNode } from 'react';

// Mock the API client functions
vi.mock('./stationsApi', () => ({
  fetchStationDetail: vi.fn(),
}));

describe('useStationDetail', () => {
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

  const mockStationDetail: StationsGetResponseBody = {
    stationId: '001',
    name: 'Kaivopuisto',
    location: {
      type: 'Point',
      coordinates: [24.9384, 60.1699],
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    statistics: {
      totalDepartures: 1523,
      totalArrivals: 1489,
      avgTripDurationSeconds: 895,
      avgTripDistanceMeters: 2340,
      busiestHour: 17,
      busiestDay: 2,
    },
  };

  it('should return loading state initially', () => {
    vi.mocked(fetchStationDetail).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useStationDetail({ stationId: '001' }), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should return station detail on success', async () => {
    vi.mocked(fetchStationDetail).mockResolvedValue(mockStationDetail);

    const { result } = renderHook(() => useStationDetail({ stationId: '001' }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockStationDetail);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fetchStationDetail).toHaveBeenCalledWith('001');
  });

  it('should return error on failure', async () => {
    const error = new Error('Station not found');
    vi.mocked(fetchStationDetail).mockRejectedValue(error);

    const { result } = renderHook(() => useStationDetail({ stationId: '999' }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should respect enabled option', async () => {
    vi.mocked(fetchStationDetail).mockResolvedValue(mockStationDetail);

    const { result } = renderHook(() => useStationDetail({ stationId: '001', enabled: false }), {
      wrapper,
    });

    // Should not fetch when disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(fetchStationDetail).not.toHaveBeenCalled();
  });

  it('should not fetch when stationId is empty', async () => {
    vi.mocked(fetchStationDetail).mockResolvedValue(mockStationDetail);

    const { result } = renderHook(() => useStationDetail({ stationId: '' }), { wrapper });

    // Should not fetch with empty stationId
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(fetchStationDetail).not.toHaveBeenCalled();
  });

  it('should use correct query key', async () => {
    vi.mocked(fetchStationDetail).mockResolvedValue(mockStationDetail);

    const stationId = '001';

    renderHook(() => useStationDetail({ stationId }), { wrapper });

    await waitFor(() => {
      const queryData = queryClient.getQueryData(stationsQueryKeys.detail(stationId));
      expect(queryData).toBeDefined();
    });
  });

  it('should trigger refetch when stationId changes', async () => {
    vi.mocked(fetchStationDetail).mockResolvedValue(mockStationDetail);

    const { rerender, result } = renderHook(({ stationId }) => useStationDetail({ stationId }), {
      wrapper,
      initialProps: { stationId: '001' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchStationDetail).toHaveBeenCalledWith('001');
    expect(fetchStationDetail).toHaveBeenCalledTimes(1);

    // Change stationId
    rerender({ stationId: '002' });

    await waitFor(() => expect(fetchStationDetail).toHaveBeenCalledWith('002'));
    expect(fetchStationDetail).toHaveBeenCalledTimes(2);
  });

  it('should enable fetching when stationId becomes valid', async () => {
    vi.mocked(fetchStationDetail).mockResolvedValue(mockStationDetail);

    const { rerender } = renderHook(({ stationId }) => useStationDetail({ stationId }), {
      wrapper,
      initialProps: { stationId: '' },
    });

    // Initially shouldn't fetch with empty stationId
    expect(fetchStationDetail).not.toHaveBeenCalled();

    // Update to valid stationId
    rerender({ stationId: '001' });

    await waitFor(() => expect(fetchStationDetail).toHaveBeenCalledWith('001'));
  });
});
