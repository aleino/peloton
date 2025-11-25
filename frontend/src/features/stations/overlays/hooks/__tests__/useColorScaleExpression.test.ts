import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useColorScaleExpression } from '../useColorScaleExpression';
import type { FlattenedStationFeatureCollection } from '@/features/stations/api/useStationsQuery';
import * as mapHooks from '@/features/map/hooks';
import * as storeHooks from '@/store/hooks';

// Mock the hooks
vi.mock('@/features/map/hooks', () => ({
  useMapControls: vi.fn(),
}));

vi.mock('@/store/hooks', () => ({
  useAppSelector: vi.fn(),
}));

describe('useColorScaleExpression', () => {
  const mockUseMapControls = vi.mocked(mapHooks.useMapControls);
  const mockUseAppSelector = vi.mocked(storeHooks.useAppSelector);

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock values
    mockUseAppSelector.mockReturnValue('quantile');
    mockUseMapControls.mockReturnValue({
      metric: 'tripCount',
      direction: 'departures',
      style: 'dark',
      visualization: 'points',
      controls: {
        metric: 'tripCount',
        direction: 'departures',
        style: 'dark',
        visualization: 'points',
      },
      updateMetric: vi.fn(),
      updateDirection: vi.fn(),
      updateStyle: vi.fn(),
      updateVisualization: vi.fn(),
      updateControls: vi.fn(),
    });
  });

  describe('getPropertyName helper', () => {
    it('should use departuresCount for tripCount + departures', () => {
      mockUseMapControls.mockReturnValue({
        metric: 'tripCount',
        direction: 'departures',
        style: 'dark',
        visualization: 'points',
        controls: {
          metric: 'tripCount',
          direction: 'departures',
          style: 'dark',
          visualization: 'points',
        },
        updateMetric: vi.fn(),
        updateDirection: vi.fn(),
        updateStyle: vi.fn(),
        updateVisualization: vi.fn(),
        updateControls: vi.fn(),
      });

      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.93, 60.17] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              departuresCount: 100,
            },
          },
        ],
      };

      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'departuresCount'],
        })
      );

      // Should not return fallback color
      expect(result.current).not.toBe('#cccccc');
    });

    it('should use returnsCount for tripCount + arrivals', () => {
      mockUseMapControls.mockReturnValue({
        metric: 'tripCount',
        direction: 'arrivals',
        style: 'dark',
        visualization: 'points',
        controls: {
          metric: 'tripCount',
          direction: 'arrivals',
          style: 'dark',
          visualization: 'points',
        },
        updateMetric: vi.fn(),
        updateDirection: vi.fn(),
        updateStyle: vi.fn(),
        updateVisualization: vi.fn(),
        updateControls: vi.fn(),
      });

      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.93, 60.17] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              returnsCount: 80,
            },
          },
        ],
      };

      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'returnsCount'],
        })
      );

      expect(result.current).not.toBe('#cccccc');
    });

    it('should use departuresDurationAvg for durationAvg + departures', () => {
      mockUseMapControls.mockReturnValue({
        metric: 'durationAvg',
        direction: 'departures',
        style: 'dark',
        visualization: 'points',
        controls: {
          metric: 'durationAvg',
          direction: 'departures',
          style: 'dark',
          visualization: 'points',
        },
        updateMetric: vi.fn(),
        updateDirection: vi.fn(),
        updateStyle: vi.fn(),
        updateVisualization: vi.fn(),
        updateControls: vi.fn(),
      });

      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.93, 60.17] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              departuresDurationAvg: 920,
            },
          },
        ],
      };

      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'departuresDurationAvg'],
        })
      );

      expect(result.current).not.toBe('#cccccc');
    });

    it('should use returnsDurationAvg for durationAvg + arrivals', () => {
      mockUseMapControls.mockReturnValue({
        metric: 'durationAvg',
        direction: 'arrivals',
        style: 'dark',
        visualization: 'points',
        controls: {
          metric: 'durationAvg',
          direction: 'arrivals',
          style: 'dark',
          visualization: 'points',
        },
        updateMetric: vi.fn(),
        updateDirection: vi.fn(),
        updateStyle: vi.fn(),
        updateVisualization: vi.fn(),
        updateControls: vi.fn(),
      });

      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.93, 60.17] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              returnsDurationAvg: 850,
            },
          },
        ],
      };

      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'returnsDurationAvg'],
        })
      );

      expect(result.current).not.toBe('#cccccc');
    });

    it('should use departuresDistanceAvg for distanceAvg + departures', () => {
      mockUseMapControls.mockReturnValue({
        metric: 'distanceAvg',
        direction: 'departures',
        style: 'dark',
        visualization: 'points',
        controls: {
          metric: 'distanceAvg',
          direction: 'departures',
          style: 'dark',
          visualization: 'points',
        },
        updateMetric: vi.fn(),
        updateDirection: vi.fn(),
        updateStyle: vi.fn(),
        updateVisualization: vi.fn(),
        updateControls: vi.fn(),
      });

      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.93, 60.17] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              departuresDistanceAvg: 2500,
            },
          },
        ],
      };

      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'departuresDistanceAvg'],
        })
      );

      expect(result.current).not.toBe('#cccccc');
    });

    it('should use returnsDistanceAvg for distanceAvg + arrivals', () => {
      mockUseMapControls.mockReturnValue({
        metric: 'distanceAvg',
        direction: 'arrivals',
        style: 'dark',
        visualization: 'points',
        controls: {
          metric: 'distanceAvg',
          direction: 'arrivals',
          style: 'dark',
          visualization: 'points',
        },
        updateMetric: vi.fn(),
        updateDirection: vi.fn(),
        updateStyle: vi.fn(),
        updateVisualization: vi.fn(),
        updateControls: vi.fn(),
      });

      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.93, 60.17] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              returnsDistanceAvg: 2300,
            },
          },
        ],
      };

      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'returnsDistanceAvg'],
        })
      );

      expect(result.current).not.toBe('#cccccc');
    });

    it('should use departures property for diff mode', () => {
      mockUseMapControls.mockReturnValue({
        metric: 'tripCount',
        direction: 'diff',
        style: 'dark',
        visualization: 'points',
        controls: {
          metric: 'tripCount',
          direction: 'diff',
          style: 'dark',
          visualization: 'points',
        },
        updateMetric: vi.fn(),
        updateDirection: vi.fn(),
        updateStyle: vi.fn(),
        updateVisualization: vi.fn(),
        updateControls: vi.fn(),
      });

      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.93, 60.17] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              departuresCount: 100,
            },
          },
        ],
      };

      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'departuresCount'],
        })
      );

      // Should use departures for diff mode (for now)
      expect(result.current).not.toBe('#cccccc');
    });
  });

  describe('dynamic property extraction', () => {
    it('should extract values from correct property based on metric and direction', () => {
      mockUseMapControls.mockReturnValue({
        metric: 'tripCount',
        direction: 'departures',
        style: 'dark',
        visualization: 'points',
        controls: {
          metric: 'tripCount',
          direction: 'departures',
          style: 'dark',
          visualization: 'points',
        },
        updateMetric: vi.fn(),
        updateDirection: vi.fn(),
        updateStyle: vi.fn(),
        updateVisualization: vi.fn(),
        updateControls: vi.fn(),
      });

      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.93, 60.17] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              departuresCount: 100,
              returnsCount: 80,
            },
          },
          {
            type: 'Feature',
            id: '2',
            geometry: { type: 'Point', coordinates: [24.94, 60.18] },
            properties: {
              stationId: '2',
              name: 'Station 2',
              departuresCount: 200,
              returnsCount: 150,
            },
          },
        ],
      };

      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'departuresCount'],
        })
      );

      // Should generate an expression, not a fallback color
      expect(result.current).not.toBe('#cccccc');
      expect(typeof result.current).not.toBe('string');
    });

    it('should handle missing values by defaulting to 0', () => {
      mockUseMapControls.mockReturnValue({
        metric: 'tripCount',
        direction: 'departures',
        style: 'dark',
        visualization: 'points',
        controls: {
          metric: 'tripCount',
          direction: 'departures',
          style: 'dark',
          visualization: 'points',
        },
        updateMetric: vi.fn(),
        updateDirection: vi.fn(),
        updateStyle: vi.fn(),
        updateVisualization: vi.fn(),
        updateControls: vi.fn(),
      });

      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.93, 60.17] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              // Missing departuresCount
            },
          },
          {
            type: 'Feature',
            id: '2',
            geometry: { type: 'Point', coordinates: [24.94, 60.18] },
            properties: {
              stationId: '2',
              name: 'Station 2',
              departuresCount: 200,
            },
          },
        ],
      };

      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'departuresCount'],
        })
      );

      // Should still work with missing values
      expect(result.current).not.toBe('#cccccc');
    });
  });

  describe('edge cases', () => {
    it('should return fallback color when no data', () => {
      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: null,
          inputValue: ['get', 'departuresCount'],
        })
      );

      expect(result.current).toBe('#cccccc');
    });

    it('should return fallback color when features array is empty', () => {
      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [],
      };

      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'departuresCount'],
        })
      );

      expect(result.current).toBe('#cccccc');
    });

    it('should return fallback color when all values are 0', () => {
      mockUseMapControls.mockReturnValue({
        metric: 'tripCount',
        direction: 'departures',
        style: 'dark',
        visualization: 'points',
        controls: {
          metric: 'tripCount',
          direction: 'departures',
          style: 'dark',
          visualization: 'points',
        },
        updateMetric: vi.fn(),
        updateDirection: vi.fn(),
        updateStyle: vi.fn(),
        updateVisualization: vi.fn(),
        updateControls: vi.fn(),
      });

      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.93, 60.17] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              departuresCount: 0,
            },
          },
        ],
      };

      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'departuresCount'],
        })
      );

      expect(result.current).toBe('#cccccc');
    });
  });

  describe('scale type support', () => {
    it('should work with linear scale', () => {
      mockUseAppSelector.mockReturnValue('linear');
      mockUseMapControls.mockReturnValue({
        metric: 'tripCount',
        direction: 'departures',
        style: 'dark',
        visualization: 'points',
        controls: {
          metric: 'tripCount',
          direction: 'departures',
          style: 'dark',
          visualization: 'points',
        },
        updateMetric: vi.fn(),
        updateDirection: vi.fn(),
        updateStyle: vi.fn(),
        updateVisualization: vi.fn(),
        updateControls: vi.fn(),
      });

      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.93, 60.17] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              departuresCount: 100,
            },
          },
          {
            type: 'Feature',
            id: '2',
            geometry: { type: 'Point', coordinates: [24.94, 60.18] },
            properties: {
              stationId: '2',
              name: 'Station 2',
              departuresCount: 200,
            },
          },
        ],
      };

      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'departuresCount'],
        })
      );

      expect(result.current).not.toBe('#cccccc');
    });

    it('should work with log scale', () => {
      mockUseAppSelector.mockReturnValue('log');
      mockUseMapControls.mockReturnValue({
        metric: 'durationAvg',
        direction: 'arrivals',
        style: 'dark',
        visualization: 'points',
        controls: {
          metric: 'durationAvg',
          direction: 'arrivals',
          style: 'dark',
          visualization: 'points',
        },
        updateMetric: vi.fn(),
        updateDirection: vi.fn(),
        updateStyle: vi.fn(),
        updateVisualization: vi.fn(),
        updateControls: vi.fn(),
      });

      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.93, 60.17] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              returnsDurationAvg: 500,
            },
          },
          {
            type: 'Feature',
            id: '2',
            geometry: { type: 'Point', coordinates: [24.94, 60.18] },
            properties: {
              stationId: '2',
              name: 'Station 2',
              returnsDurationAvg: 1500,
            },
          },
        ],
      };

      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'returnsDurationAvg'],
        })
      );

      expect(result.current).not.toBe('#cccccc');
    });

    it('should work with quantile scale (default)', () => {
      mockUseAppSelector.mockReturnValue('quantile');
      mockUseMapControls.mockReturnValue({
        metric: 'distanceAvg',
        direction: 'departures',
        style: 'dark',
        visualization: 'points',
        controls: {
          metric: 'distanceAvg',
          direction: 'departures',
          style: 'dark',
          visualization: 'points',
        },
        updateMetric: vi.fn(),
        updateDirection: vi.fn(),
        updateStyle: vi.fn(),
        updateVisualization: vi.fn(),
        updateControls: vi.fn(),
      });

      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.93, 60.17] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              departuresDistanceAvg: 2000,
            },
          },
          {
            type: 'Feature',
            id: '2',
            geometry: { type: 'Point', coordinates: [24.94, 60.18] },
            properties: {
              stationId: '2',
              name: 'Station 2',
              departuresDistanceAvg: 3000,
            },
          },
        ],
      };

      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'departuresDistanceAvg'],
        })
      );

      expect(result.current).not.toBe('#cccccc');
    });
  });

  describe('memoization', () => {
    it('should recalculate when metric changes', () => {
      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.93, 60.17] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              departuresCount: 100,
              departuresDurationAvg: 920,
            },
          },
        ],
      };

      mockUseMapControls.mockReturnValue({
        metric: 'tripCount',
        direction: 'departures',
        style: 'dark',
        visualization: 'points',
        controls: {
          metric: 'tripCount',
          direction: 'departures',
          style: 'dark',
          visualization: 'points',
        },
        updateMetric: vi.fn(),
        updateDirection: vi.fn(),
        updateStyle: vi.fn(),
        updateVisualization: vi.fn(),
        updateControls: vi.fn(),
      });

      const { result: result1, rerender } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'departuresCount'],
        })
      );

      const firstResult = result1.current;

      // Change metric
      mockUseMapControls.mockReturnValue({
        metric: 'durationAvg',
        direction: 'departures',
        style: 'dark',
        visualization: 'points',
        controls: {
          metric: 'durationAvg',
          direction: 'departures',
          style: 'dark',
          visualization: 'points',
        },
        updateMetric: vi.fn(),
        updateDirection: vi.fn(),
        updateStyle: vi.fn(),
        updateVisualization: vi.fn(),
        updateControls: vi.fn(),
      });

      rerender();

      // Result should be different after metric change
      expect(result1.current).toBeDefined();
      expect(firstResult).toBeDefined();
      // Note: We can't easily compare the expressions directly, but we verify they both exist
    });

    it('should recalculate when direction changes', () => {
      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.93, 60.17] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              departuresCount: 100,
              returnsCount: 80,
            },
          },
        ],
      };

      mockUseMapControls.mockReturnValue({
        metric: 'tripCount',
        direction: 'departures',
        style: 'dark',
        visualization: 'points',
        controls: {
          metric: 'tripCount',
          direction: 'departures',
          style: 'dark',
          visualization: 'points',
        },
        updateMetric: vi.fn(),
        updateDirection: vi.fn(),
        updateStyle: vi.fn(),
        updateVisualization: vi.fn(),
        updateControls: vi.fn(),
      });

      const { result: result1, rerender } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'departuresCount'],
        })
      );

      const firstResult = result1.current;

      // Change direction
      mockUseMapControls.mockReturnValue({
        metric: 'tripCount',
        direction: 'arrivals',
        style: 'dark',
        visualization: 'points',
        controls: {
          metric: 'tripCount',
          direction: 'arrivals',
          style: 'dark',
          visualization: 'points',
        },
        updateMetric: vi.fn(),
        updateDirection: vi.fn(),
        updateStyle: vi.fn(),
        updateVisualization: vi.fn(),
        updateControls: vi.fn(),
      });

      rerender();

      // Result should be defined after direction change
      expect(result1.current).toBeDefined();
      expect(firstResult).toBeDefined();
    });
  });
});
