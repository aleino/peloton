import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStationEventHandlers } from '../useStationEventHandlers';
import * as reactMapGl from 'react-map-gl/mapbox';
import * as mapHooks from '@/features/map/hooks';
import * as stations from '@/features/stations';
import * as stationCentering from '@/features/stations/hooks/useStationCentering';
import type { MapRef } from 'react-map-gl/mapbox';
import type { StationMapEventData } from '@/features/stations/types';
import type { MapMouseEvent } from 'mapbox-gl';

vi.mock('react-map-gl/mapbox', () => ({
  useMap: vi.fn(),
}));

vi.mock('@/features/map/hooks', () => ({
  useLayerEvents: vi.fn(),
}));

vi.mock('@/features/stations', () => ({
  useStations: vi.fn(),
}));

vi.mock('@/features/stations/hooks/useStationCentering', () => ({
  useStationCentering: vi.fn(),
}));

describe('useStationEventHandlers', () => {
  let mockMap: Partial<MapRef>;
  let setHoveredStation: (station: StationMapEventData | null) => void;
  let setSelectedDepartureStationId: (stationId: string | null) => void;
  let centerOnStation: (coordinates: [number, number]) => void;
  let setFeatureState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setFeatureState = vi.fn();
    mockMap = {
      getCanvas: vi.fn().mockReturnValue({ style: { cursor: '' } }),
      setFeatureState,
    };

    setHoveredStation = vi.fn();
    setSelectedDepartureStationId = vi.fn();
    centerOnStation = vi.fn();

    vi.mocked(reactMapGl.useMap).mockReturnValue({
      main: mockMap as MapRef,
      current: mockMap as MapRef,
    });
    vi.mocked(stations.useStations).mockReturnValue({
      setHoveredStation,
      setSelectedDepartureStationId,
      hoveredStation: null,
      selectedDepartureStationId: null,
      selectedReturnStationId: null,
      setSelectedReturnStationId: vi.fn(),
      clearStationSelections: vi.fn(),
      showAllTooltips: false,
      visibleStationsForTooltips: [],
      setShowAllTooltips: vi.fn(),
      setVisibleStationsForTooltips: vi.fn(),
    });
    vi.mocked(stationCentering.useStationCentering).mockReturnValue({
      centerOnStation,
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
    });
  });

  it('should use generic useLayerEvents hook', () => {
    renderHook(() => useStationEventHandlers('test-layer', 'test-source'));

    expect(mapHooks.useLayerEvents).toHaveBeenCalledWith({
      layerId: 'test-layer',
      handlers: expect.objectContaining({
        onClick: expect.any(Function),
        onMouseMove: expect.any(Function),
        onMouseLeave: expect.any(Function),
      }),
    });
  });

  it('should provide onClick handler', () => {
    let capturedHandlers: mapHooks.LayerEventHandlers | undefined;
    vi.mocked(mapHooks.useLayerEvents).mockImplementation((options) => {
      capturedHandlers = options.handlers;
    });

    renderHook(() => useStationEventHandlers('test-layer', 'test-source'));

    expect(capturedHandlers).toBeDefined();
    expect(capturedHandlers!.onClick).toBeDefined();
  });

  it('should provide onMouseMove handler', () => {
    let capturedHandlers: mapHooks.LayerEventHandlers | undefined;
    vi.mocked(mapHooks.useLayerEvents).mockImplementation((options) => {
      capturedHandlers = options.handlers;
    });

    renderHook(() => useStationEventHandlers('test-layer', 'test-source'));

    expect(capturedHandlers).toBeDefined();
    expect(capturedHandlers!.onMouseMove).toBeDefined();
  });

  it('should provide onMouseLeave handler', () => {
    let capturedHandlers: mapHooks.LayerEventHandlers | undefined;
    vi.mocked(mapHooks.useLayerEvents).mockImplementation((options) => {
      capturedHandlers = options.handlers;
    });

    renderHook(() => useStationEventHandlers('test-layer', 'test-source'));

    expect(capturedHandlers).toBeDefined();
    expect(capturedHandlers!.onMouseLeave).toBeDefined();
  });

  it('should handle re-renders correctly', () => {
    const { rerender } = renderHook(() => useStationEventHandlers('test-layer', 'test-source'));

    rerender();

    expect(mapHooks.useLayerEvents).toHaveBeenCalled();
  });

  describe('hover behavior', () => {
    it('should set hover feature-state on mouse move', () => {
      let capturedHandlers: mapHooks.LayerEventHandlers | undefined;
      vi.mocked(mapHooks.useLayerEvents).mockImplementation((options) => {
        capturedHandlers = options.handlers;
      });

      renderHook(() => useStationEventHandlers('test-layer', 'test-source'));

      const mockEvent = {
        features: [
          {
            id: 123,
            properties: { stationId: 'station-1', name: 'Test Station' },
            geometry: { type: 'Point', coordinates: [24.9384, 60.1699] },
          },
        ],
      } as unknown as MapMouseEvent;

      capturedHandlers!.onMouseMove!(mockEvent);

      expect(setFeatureState).toHaveBeenCalledWith(
        { source: 'test-source', id: 123 },
        { hover: true }
      );
      expect(setHoveredStation).toHaveBeenCalledWith({
        stationId: 'station-1',
        coordinates: [24.9384, 60.1699],
        properties: expect.objectContaining({ stationId: 'station-1' }),
      });
    });

    it('should clear previous hover state when hovering new station', () => {
      let capturedHandlers: mapHooks.LayerEventHandlers | undefined;
      vi.mocked(mapHooks.useLayerEvents).mockImplementation((options) => {
        capturedHandlers = options.handlers;
      });

      renderHook(() => useStationEventHandlers('test-layer', 'test-source'));

      // Hover first station
      const mockEvent1 = {
        features: [
          {
            id: 123,
            properties: { stationId: 'station-1' },
            geometry: { type: 'Point', coordinates: [24.9384, 60.1699] },
          },
        ],
      } as unknown as MapMouseEvent;

      capturedHandlers!.onMouseMove!(mockEvent1);

      // Hover second station
      const mockEvent2 = {
        features: [
          {
            id: 456,
            properties: { stationId: 'station-2' },
            geometry: { type: 'Point', coordinates: [24.94, 60.17] },
          },
        ],
      } as unknown as MapMouseEvent;

      capturedHandlers!.onMouseMove!(mockEvent2);

      // Should clear first station's hover
      expect(setFeatureState).toHaveBeenCalledWith(
        { source: 'test-source', id: 123 },
        { hover: false }
      );
      // Should set second station's hover
      expect(setFeatureState).toHaveBeenCalledWith(
        { source: 'test-source', id: 456 },
        { hover: true }
      );
    });

    it('should clear hover state on mouse leave', () => {
      let capturedHandlers: mapHooks.LayerEventHandlers | undefined;
      vi.mocked(mapHooks.useLayerEvents).mockImplementation((options) => {
        capturedHandlers = options.handlers;
      });

      renderHook(() => useStationEventHandlers('test-layer', 'test-source'));

      // Hover station
      const mockEvent = {
        features: [
          {
            id: 123,
            properties: { stationId: 'station-1' },
            geometry: { type: 'Point', coordinates: [24.9384, 60.1699] },
          },
        ],
      } as unknown as MapMouseEvent;

      capturedHandlers!.onMouseMove!(mockEvent);

      // Leave layer
      capturedHandlers!.onMouseLeave!();

      expect(setFeatureState).toHaveBeenCalledWith(
        { source: 'test-source', id: 123 },
        { hover: false }
      );
      expect(setHoveredStation).toHaveBeenCalledWith(null);
    });

    it('should change cursor to pointer on hover', () => {
      let capturedHandlers: mapHooks.LayerEventHandlers | undefined;
      vi.mocked(mapHooks.useLayerEvents).mockImplementation((options) => {
        capturedHandlers = options.handlers;
      });

      const canvasElement = { style: { cursor: '' } };
      mockMap.getCanvas = vi.fn().mockReturnValue(canvasElement);

      renderHook(() => useStationEventHandlers('test-layer', 'test-source'));

      const mockEvent = {
        features: [
          {
            id: 123,
            properties: { stationId: 'station-1' },
            geometry: { type: 'Point', coordinates: [24.9384, 60.1699] },
          },
        ],
      } as unknown as MapMouseEvent;

      capturedHandlers!.onMouseMove!(mockEvent);

      expect(canvasElement.style.cursor).toBe('pointer');
    });

    it('should reset cursor on mouse leave', () => {
      let capturedHandlers: mapHooks.LayerEventHandlers | undefined;
      vi.mocked(mapHooks.useLayerEvents).mockImplementation((options) => {
        capturedHandlers = options.handlers;
      });

      const canvasElement = { style: { cursor: 'pointer' } };
      mockMap.getCanvas = vi.fn().mockReturnValue(canvasElement);

      renderHook(() => useStationEventHandlers('test-layer', 'test-source'));

      capturedHandlers!.onMouseLeave!();

      expect(canvasElement.style.cursor).toBe('');
    });
  });

  describe('selection behavior', () => {
    it('should set selected feature-state on click', () => {
      let capturedHandlers: mapHooks.LayerEventHandlers | undefined;
      vi.mocked(mapHooks.useLayerEvents).mockImplementation((options) => {
        capturedHandlers = options.handlers;
      });

      renderHook(() => useStationEventHandlers('test-layer', 'test-source'));

      const mockEvent = {
        features: [
          {
            id: 123,
            properties: { stationId: 'station-1' },
            geometry: { type: 'Point', coordinates: [24.9384, 60.1699] },
          },
        ],
      } as unknown as MapMouseEvent;

      capturedHandlers!.onClick!(mockEvent);

      expect(setFeatureState).toHaveBeenCalledWith(
        { source: 'test-source', id: 123 },
        { selected: true }
      );
      expect(setSelectedDepartureStationId).toHaveBeenCalledWith('station-1');
      expect(centerOnStation).toHaveBeenCalledWith([24.9384, 60.1699]);
    });

    it('should clear previous selection when selecting new station', () => {
      let capturedHandlers: mapHooks.LayerEventHandlers | undefined;
      vi.mocked(mapHooks.useLayerEvents).mockImplementation((options) => {
        capturedHandlers = options.handlers;
      });

      renderHook(() => useStationEventHandlers('test-layer', 'test-source'));

      // Select first station
      const mockEvent1 = {
        features: [
          {
            id: 123,
            properties: { stationId: 'station-1' },
            geometry: { type: 'Point', coordinates: [24.9384, 60.1699] },
          },
        ],
      } as unknown as MapMouseEvent;

      capturedHandlers!.onClick!(mockEvent1);

      // Select second station
      const mockEvent2 = {
        features: [
          {
            id: 456,
            properties: { stationId: 'station-2' },
            geometry: { type: 'Point', coordinates: [24.94, 60.17] },
          },
        ],
      } as unknown as MapMouseEvent;

      capturedHandlers!.onClick!(mockEvent2);

      // Should clear first station's selection
      expect(setFeatureState).toHaveBeenCalledWith(
        { source: 'test-source', id: 123 },
        { selected: false }
      );
      // Should set second station's selection
      expect(setFeatureState).toHaveBeenCalledWith(
        { source: 'test-source', id: 456 },
        { selected: true }
      );
    });

    it('should clear selection feature-state when Redux state becomes null', () => {
      vi.mocked(stations.useStations).mockReturnValue({
        setHoveredStation,
        setSelectedDepartureStationId,
        hoveredStation: null,
        selectedDepartureStationId: 'station-1',
        selectedReturnStationId: null,
        setSelectedReturnStationId: vi.fn(),
        clearStationSelections: vi.fn(),
        showAllTooltips: false,
        visibleStationsForTooltips: [],
        setShowAllTooltips: vi.fn(),
        setVisibleStationsForTooltips: vi.fn(),
      });

      let capturedHandlers: mapHooks.LayerEventHandlers | undefined;
      vi.mocked(mapHooks.useLayerEvents).mockImplementation((options) => {
        capturedHandlers = options.handlers;
      });

      const { rerender } = renderHook(() => useStationEventHandlers('test-layer', 'test-source'));

      // Select a station first
      const mockEvent = {
        features: [
          {
            id: 123,
            properties: { stationId: 'station-1' },
            geometry: { type: 'Point', coordinates: [24.9384, 60.1699] },
          },
        ],
      } as unknown as MapMouseEvent;

      capturedHandlers!.onClick!(mockEvent);

      // Clear the mock calls
      setFeatureState.mockClear();

      // Update Redux state to null (simulating closing details panel)
      vi.mocked(stations.useStations).mockReturnValue({
        setHoveredStation,
        setSelectedDepartureStationId,
        hoveredStation: null,
        selectedDepartureStationId: null,
        selectedReturnStationId: null,
        setSelectedReturnStationId: vi.fn(),
        clearStationSelections: vi.fn(),
        showAllTooltips: false,
        visibleStationsForTooltips: [],
        setShowAllTooltips: vi.fn(),
        setVisibleStationsForTooltips: vi.fn(),
      });

      rerender();

      // Should clear selection feature-state
      expect(setFeatureState).toHaveBeenCalledWith(
        { source: 'test-source', id: 123 },
        { selected: false }
      );
    });

    it('should not clear selection when station remains selected', () => {
      vi.mocked(stations.useStations).mockReturnValue({
        setHoveredStation,
        setSelectedDepartureStationId,
        hoveredStation: null,
        selectedDepartureStationId: 'station-1',
        selectedReturnStationId: null,
        setSelectedReturnStationId: vi.fn(),
        clearStationSelections: vi.fn(),
        showAllTooltips: false,
        visibleStationsForTooltips: [],
        setShowAllTooltips: vi.fn(),
        setVisibleStationsForTooltips: vi.fn(),
      });

      const { rerender } = renderHook(() => useStationEventHandlers('test-layer', 'test-source'));

      // Clear initial mock calls
      setFeatureState.mockClear();

      // Rerender with same selection
      rerender();

      // Should NOT call setFeatureState (selection unchanged)
      expect(setFeatureState).not.toHaveBeenCalled();
    });
  });
});
