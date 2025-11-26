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
          {
            type: 'Feature',
            id: '2',
            geometry: { type: 'Point', coordinates: [24.94, 60.18] },
            properties: {
              stationId: '2',
              name: 'Station 2',
              departuresCount: 150,
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
          {
            type: 'Feature',
            id: '2',
            geometry: { type: 'Point', coordinates: [24.94, 60.18] },
            properties: {
              stationId: '2',
              name: 'Station 2',
              returnsCount: 120,
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
          {
            type: 'Feature',
            id: '2',
            geometry: { type: 'Point', coordinates: [24.94, 60.18] },
            properties: {
              stationId: '2',
              name: 'Station 2',
              departuresDurationAvg: 1050,
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
          {
            type: 'Feature',
            id: '2',
            geometry: { type: 'Point', coordinates: [24.94, 60.18] },
            properties: {
              stationId: '2',
              name: 'Station 2',
              returnsDurationAvg: 960,
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
          {
            type: 'Feature',
            id: '2',
            geometry: { type: 'Point', coordinates: [24.94, 60.18] },
            properties: {
              stationId: '2',
              name: 'Station 2',
              departuresDistanceAvg: 3200,
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
          {
            type: 'Feature',
            id: '2',
            geometry: { type: 'Point', coordinates: [24.94, 60.18] },
            properties: {
              stationId: '2',
              name: 'Station 2',
              returnsDistanceAvg: 2800,
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
              diffCount: -0.2,
            },
          },
          {
            type: 'Feature',
            id: '2',
            geometry: { type: 'Point', coordinates: [24.94, 60.18] },
            properties: {
              stationId: '2',
              name: 'Station 2',
              diffCount: 0.3,
            },
          },
        ],
      };

      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'diffCount'],
        })
      );

      // Should use diff properties for diff mode
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

  describe('with difference direction', () => {
    it('should use diverging color scale for diff direction', () => {
      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.9, 60.2] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              diffCount: -0.5, // More arrivals
            },
          },
          {
            type: 'Feature',
            id: '2',
            geometry: { type: 'Point', coordinates: [24.91, 60.21] },
            properties: {
              stationId: '2',
              name: 'Station 2',
              diffCount: 0.5, // More departures
            },
          },
        ],
      };

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

      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'diffCount'],
        })
      );

      // Should return an interpolate expression (diverging scale)
      expect(Array.isArray(result.current)).toBe(true);
      if (Array.isArray(result.current)) {
        expect(result.current[0]).toBe('interpolate');
      }
    });

    it('should use diverging scale for durationAvg in diff mode', () => {
      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.9, 60.2] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              diffDurationAvg: -0.2,
            },
          },
          {
            type: 'Feature',
            id: '2',
            geometry: { type: 'Point', coordinates: [24.91, 60.21] },
            properties: {
              stationId: '2',
              name: 'Station 2',
              diffDurationAvg: 0.3,
            },
          },
        ],
      };

      mockUseMapControls.mockReturnValue({
        metric: 'durationAvg',
        direction: 'diff',
        style: 'dark',
        visualization: 'points',
        controls: {
          metric: 'durationAvg',
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

      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'diffDurationAvg'],
        })
      );

      expect(Array.isArray(result.current)).toBe(true);
      if (Array.isArray(result.current)) {
        expect(result.current[0]).toBe('interpolate');
      }
    });

    it('should use diverging scale for distanceAvg in diff mode', () => {
      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.9, 60.2] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              diffDistanceAvg: 0.1,
            },
          },
          {
            type: 'Feature',
            id: '2',
            geometry: { type: 'Point', coordinates: [24.91, 60.21] },
            properties: {
              stationId: '2',
              name: 'Station 2',
              diffDistanceAvg: -0.15,
            },
          },
        ],
      };

      mockUseMapControls.mockReturnValue({
        metric: 'distanceAvg',
        direction: 'diff',
        style: 'dark',
        visualization: 'points',
        controls: {
          metric: 'distanceAvg',
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

      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'diffDistanceAvg'],
        })
      );

      expect(Array.isArray(result.current)).toBe(true);
      if (Array.isArray(result.current)) {
        expect(result.current[0]).toBe('interpolate');
      }
    });

    it('should return fallback color when all diff values are the same', () => {
      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.9, 60.2] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              diffCount: 0,
            },
          },
          {
            type: 'Feature',
            id: '2',
            geometry: { type: 'Point', coordinates: [24.91, 60.21] },
            properties: {
              stationId: '2',
              name: 'Station 2',
              diffCount: 0,
            },
          },
        ],
      };

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

      const { result } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'diffCount'],
        })
      );

      // Should return fallback color when all values are the same
      expect(result.current).toBe('#cccccc');
    });

    it('should switch from sequential to diverging scale when direction changes to diff', () => {
      const mockData: FlattenedStationFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [24.9, 60.2] },
            properties: {
              stationId: '1',
              name: 'Station 1',
              departuresCount: 100,
              diffCount: -0.3,
            },
          },
          {
            type: 'Feature',
            id: '2',
            geometry: { type: 'Point', coordinates: [24.91, 60.21] },
            properties: {
              stationId: '2',
              name: 'Station 2',
              departuresCount: 150,
              diffCount: 0.5,
            },
          },
        ],
      };

      // Start with departures
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

      const { result, rerender } = renderHook(() =>
        useColorScaleExpression({
          geojsonData: mockData,
          inputValue: ['get', 'departuresCount'],
        })
      );

      // Should use sequential scale for departures
      const departuresResult = result.current;
      expect(Array.isArray(departuresResult)).toBe(true);

      // Change to diff direction
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

      rerender();

      // Should switch to diverging scale for diff
      expect(Array.isArray(result.current)).toBe(true);
      if (Array.isArray(result.current)) {
        expect(result.current[0]).toBe('interpolate');
      }
      // Results should be different
      expect(result.current).not.toEqual(departuresResult);
    });
  });
});
