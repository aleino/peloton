import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHelsinkiAreaBoundary, clearBoundaryCache } from './useHelsinkiAreaBoundary';

// Mock fetch
const mockBoundaryData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [24.6, 60.0],
          [25.3, 60.0],
          [25.3, 60.4],
          [24.6, 60.4],
        ],
      },
      properties: {},
    },
  ],
};

describe('useHelsinkiAreaBoundary', () => {
  beforeEach(() => {
    clearBoundaryCache();
    vi.resetAllMocks();
  });

  it('should return loading state initially', () => {
    global.fetch = vi.fn(() => new Promise<Response>(() => {})); // Never resolves

    const { result } = renderHook(() => useHelsinkiAreaBoundary());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch and return boundary data', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockBoundaryData),
      } as Response)
    );

    const { result } = renderHook(() => useHelsinkiAreaBoundary());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.bounds).toEqual([24.6, 60.0, 25.3, 60.4]);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response)
    );

    const { result } = renderHook(() => useHelsinkiAreaBoundary());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toContain('404');
  });

  it('should cache results across hook instances', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockBoundaryData),
      } as Response)
    );

    // First render
    const { result: result1 } = renderHook(() => useHelsinkiAreaBoundary());
    await waitFor(() => expect(result1.current.isLoading).toBe(false));

    // Second render (should use cache)
    const { result: result2 } = renderHook(() => useHelsinkiAreaBoundary());

    // Should immediately have data from cache
    expect(result2.current.isLoading).toBe(false);
    expect(result2.current.data).not.toBeNull();

    // Fetch should only be called once
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle invalid GeoJSON (no features)', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ type: 'FeatureCollection', features: [] }),
      } as Response)
    );

    const { result } = renderHook(() => useHelsinkiAreaBoundary());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toContain('no features found');
  });

  it('should handle invalid geometry type', async () => {
    const invalidData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [24.9, 60.2],
          },
          properties: {},
        },
      ],
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(invalidData),
      } as Response)
    );

    const { result } = renderHook(() => useHelsinkiAreaBoundary());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toContain('expected LineString');
  });
});
