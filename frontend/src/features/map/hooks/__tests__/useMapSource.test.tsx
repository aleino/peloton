import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMapSource } from '../useMapSource';

const mockUseMap = vi.fn();

vi.mock('react-map-gl/mapbox', () => ({
  useMap: () => mockUseMap(),
}));

describe('useMapSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null when map is not ready', () => {
    mockUseMap.mockReturnValue({ main: null });

    const { result } = renderHook(() => useMapSource('test-source'));

    expect(result.current).toBeNull();
  });

  it('should return null when source does not exist', () => {
    const mockMap = {
      getSource: vi.fn().mockReturnValue(null),
      once: vi.fn(),
      off: vi.fn(),
    };

    mockUseMap.mockReturnValue({ main: mockMap });

    const { result } = renderHook(() => useMapSource('test-source'));

    expect(result.current).toBeNull();
  });

  it('should return GeoJSON data when source is ready', async () => {
    const mockData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [0, 0] },
          properties: { name: 'Test' },
        },
      ],
    };

    const mockSource = {
      type: 'geojson',
      serialize: () => ({ data: mockData }),
    };

    const mockMap = {
      getSource: vi.fn().mockReturnValue(mockSource),
      once: vi.fn(),
      off: vi.fn(),
    };

    mockUseMap.mockReturnValue({ main: mockMap });

    const { result } = renderHook(() => useMapSource('test-source'));

    await waitFor(() => {
      expect(result.current).toEqual(mockData);
    });
  });

  it('should handle source with string data', () => {
    const mockSource = {
      type: 'geojson',
      serialize: () => ({ data: 'https://example.com/data.geojson' }),
    };

    const mockMap = {
      getSource: vi.fn().mockReturnValue(mockSource),
      once: vi.fn(),
      off: vi.fn(),
    };

    mockUseMap.mockReturnValue({ main: mockMap });

    const { result } = renderHook(() => useMapSource('test-source'));

    expect(result.current).toBeNull();
  });

  it('should handle non-geojson source types', () => {
    const mockSource = {
      type: 'vector',
    };

    const mockMap = {
      getSource: vi.fn().mockReturnValue(mockSource),
      once: vi.fn(),
      off: vi.fn(),
    };

    mockUseMap.mockReturnValue({ main: mockMap });

    const { result } = renderHook(() => useMapSource('test-source'));

    expect(result.current).toBeNull();
  });

  it('should register idle event listener when source does not exist', () => {
    const mockMap = {
      getSource: vi.fn().mockReturnValue(null),
      once: vi.fn(),
      off: vi.fn(),
    };

    mockUseMap.mockReturnValue({ main: mockMap });

    const { result } = renderHook(() => useMapSource('test-source'));

    // Verify that idle event listener was registered
    expect(mockMap.once).toHaveBeenCalledWith('idle', expect.any(Function));
    expect(result.current).toBeNull();
  });

  it('should cleanup on unmount', () => {
    const mockMap = {
      getSource: vi.fn().mockReturnValue(null),
      once: vi.fn(),
      off: vi.fn(),
    };

    mockUseMap.mockReturnValue({ main: mockMap });

    const { unmount } = renderHook(() => useMapSource('test-source'));

    unmount();

    expect(mockMap.off).toHaveBeenCalledWith('idle', expect.any(Function));
  });

  it('should update when sourceId changes', async () => {
    const mockData1 = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] } }],
    };

    const mockData2 = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [1, 1] } }],
    };

    const mockSource1 = {
      type: 'geojson',
      serialize: () => ({ data: mockData1 }),
    };

    const mockSource2 = {
      type: 'geojson',
      serialize: () => ({ data: mockData2 }),
    };

    const mockMap = {
      getSource: vi
        .fn()
        .mockImplementation((id) => (id === 'source-1' ? mockSource1 : mockSource2)),
      once: vi.fn(),
      off: vi.fn(),
    };

    mockUseMap.mockReturnValue({ main: mockMap });

    const { result, rerender } = renderHook(({ sourceId }) => useMapSource(sourceId), {
      initialProps: { sourceId: 'source-1' },
    });

    await waitFor(() => {
      expect(result.current).toEqual(mockData1);
    });

    rerender({ sourceId: 'source-2' });

    await waitFor(() => {
      expect(result.current).toEqual(mockData2);
    });
  });
});
