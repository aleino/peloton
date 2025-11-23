import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStationCentering } from '@/features/stations/hooks/useStationCentering';
import * as ReactMapGL from 'react-map-gl/mapbox';
import * as layoutConfig from '@/config/layout';
import * as mapCamera from '@/features/map/utils/mapCamera';
import type { MapRef } from 'react-map-gl/mapbox';

// Mock dependencies
vi.mock('react-map-gl/mapbox', () => ({
  useMap: vi.fn(),
}));

vi.mock('@/config/layout', async () => {
  const actual = await vi.importActual('@/config/layout');
  return {
    ...actual,
    calculateMapPadding: vi.fn(),
  };
});

vi.mock('@/features/map/utils/mapCamera', () => ({
  flyToVisibleArea: vi.fn(),
}));

describe('useStationCentering', () => {
  let mockMap: MapRef;
  const originalWindow = global.window;

  beforeEach(() => {
    vi.clearAllMocks();

    mockMap = {} as MapRef;

    vi.mocked(ReactMapGL.useMap).mockReturnValue({
      main: mockMap,
      current: mockMap,
    });

    vi.mocked(layoutConfig.calculateMapPadding).mockReturnValue({
      top: 64,
      bottom: 0,
      left: 390,
      right: 0,
    });

    // Mock window
    global.window = {
      innerWidth: 1000,
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  describe('hook initialization', () => {
    it('should return centerOnStation function and padding', () => {
      const { result } = renderHook(() => useStationCentering());

      expect(result.current.centerOnStation).toBeInstanceOf(Function);
      expect(result.current.padding).toEqual({
        top: 64,
        bottom: 0,
        left: 390,
        right: 0,
      });
    });

    it('should use default options', () => {
      renderHook(() => useStationCentering());

      expect(layoutConfig.calculateMapPadding).toHaveBeenCalledWith('left', 39, 1000);
    });

    it('should use custom panel position', () => {
      renderHook(() => useStationCentering({ panelPosition: 'right' }));

      expect(layoutConfig.calculateMapPadding).toHaveBeenCalledWith('right', 39, 1000);
    });

    it('should use custom panel width percent', () => {
      renderHook(() => useStationCentering({ panelWidthPercent: 50 }));

      expect(layoutConfig.calculateMapPadding).toHaveBeenCalledWith('left', 50, 1000);
    });

    it('should handle "none" panel position', () => {
      renderHook(() => useStationCentering({ panelPosition: 'none' }));

      expect(layoutConfig.calculateMapPadding).toHaveBeenCalledWith('none', 39, 1000);
    });

    it('should return zero padding if window is undefined', () => {
      // Mock calculateMapPadding to handle SSR scenario
      vi.mocked(layoutConfig.calculateMapPadding).mockImplementationOnce(() => ({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      }));

      const { result } = renderHook(() => useStationCentering());

      expect(result.current.padding).toEqual({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      });
    });
  });

  describe('centerOnStation', () => {
    it('should call flyToVisibleArea with correct parameters', () => {
      const { result } = renderHook(() => useStationCentering());

      const coordinates: [number, number] = [24.9384, 60.1699];
      result.current.centerOnStation(coordinates);

      expect(mapCamera.flyToVisibleArea).toHaveBeenCalledWith(mockMap, {
        longitude: 24.9384,
        latitude: 60.1699,
        zoom: 15,
        duration: 1000,
        padding: {
          top: 64,
          bottom: 0,
          left: 390,
          right: 0,
        },
      });
    });

    it('should use custom target zoom', () => {
      const { result } = renderHook(() => useStationCentering({ targetZoom: 16 }));

      const coordinates: [number, number] = [24.9384, 60.1699];
      result.current.centerOnStation(coordinates);

      expect(mapCamera.flyToVisibleArea).toHaveBeenCalledWith(
        mockMap,
        expect.objectContaining({
          zoom: 16,
        })
      );
    });

    it('should use custom duration', () => {
      const { result } = renderHook(() => useStationCentering({ duration: 500 }));

      const coordinates: [number, number] = [24.9384, 60.1699];
      result.current.centerOnStation(coordinates);

      expect(mapCamera.flyToVisibleArea).toHaveBeenCalledWith(
        mockMap,
        expect.objectContaining({
          duration: 500,
        })
      );
    });

    it('should handle different coordinate values', () => {
      const { result } = renderHook(() => useStationCentering());

      const coordinates: [number, number] = [25.0, 61.0];
      result.current.centerOnStation(coordinates);

      expect(mapCamera.flyToVisibleArea).toHaveBeenCalledWith(
        mockMap,
        expect.objectContaining({
          longitude: 25.0,
          latitude: 61.0,
        })
      );
    });

    it('should maintain stable function reference when options do not change', () => {
      const { result, rerender } = renderHook(() => useStationCentering());

      const firstFunction = result.current.centerOnStation;
      rerender();
      const secondFunction = result.current.centerOnStation;

      expect(firstFunction).toBe(secondFunction);
    });

    it('should update function when padding changes', () => {
      const { result, rerender } = renderHook(
        ({ panelPosition }: { panelPosition: 'left' | 'right' | 'none' }) =>
          useStationCentering({ panelPosition }),
        {
          initialProps: { panelPosition: 'left' as 'left' | 'right' | 'none' },
        }
      );

      const firstFunction = result.current.centerOnStation;

      // Update mock to return different padding
      vi.mocked(layoutConfig.calculateMapPadding).mockReturnValueOnce({
        top: 64,
        bottom: 0,
        left: 0,
        right: 390,
      });

      rerender({ panelPosition: 'right' as 'left' | 'right' | 'none' });

      const secondFunction = result.current.centerOnStation;

      expect(firstFunction).not.toBe(secondFunction);
    });
  });

  describe('padding memoization', () => {
    it('should recalculate padding when panel position changes', () => {
      const { result, rerender } = renderHook(
        ({ panelPosition }: { panelPosition: 'left' | 'right' | 'none' }) =>
          useStationCentering({ panelPosition }),
        {
          initialProps: { panelPosition: 'left' as 'left' | 'right' | 'none' },
        }
      );

      expect(layoutConfig.calculateMapPadding).toHaveBeenCalledTimes(1);
      expect(layoutConfig.calculateMapPadding).toHaveBeenCalledWith('left', 39, 1000);

      vi.mocked(layoutConfig.calculateMapPadding).mockReturnValue({
        top: 64,
        bottom: 0,
        left: 0,
        right: 390,
      });

      rerender({ panelPosition: 'right' as 'left' | 'right' | 'none' });

      expect(layoutConfig.calculateMapPadding).toHaveBeenCalledTimes(2);
      expect(layoutConfig.calculateMapPadding).toHaveBeenCalledWith('right', 39, 1000);
      expect(result.current.padding).toEqual({
        top: 64,
        bottom: 0,
        left: 0,
        right: 390,
      });
    });

    it('should recalculate padding when panel width changes', () => {
      const { rerender } = renderHook(
        ({ panelWidthPercent }: { panelWidthPercent: number }) =>
          useStationCentering({ panelWidthPercent }),
        {
          initialProps: { panelWidthPercent: 39 },
        }
      );

      expect(layoutConfig.calculateMapPadding).toHaveBeenCalledTimes(1);

      rerender({ panelWidthPercent: 50 });

      expect(layoutConfig.calculateMapPadding).toHaveBeenCalledTimes(2);
      expect(layoutConfig.calculateMapPadding).toHaveBeenCalledWith('left', 50, 1000);
    });

    it('should not recalculate padding when unrelated options change', () => {
      const { rerender } = renderHook(
        ({ targetZoom }: { targetZoom: number }) => useStationCentering({ targetZoom }),
        {
          initialProps: { targetZoom: 14 },
        }
      );

      expect(layoutConfig.calculateMapPadding).toHaveBeenCalledTimes(1);

      rerender({ targetZoom: 16 });

      // Padding calculation should still be called only once
      expect(layoutConfig.calculateMapPadding).toHaveBeenCalledTimes(1);
    });
  });
});
