import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStationEventHandlers } from '../useStationEventHandlers';
import * as reactMapGl from 'react-map-gl/mapbox';
import * as mapHooks from '@/features/map/hooks';
import * as stations from '@/features/stations';
import type { MapRef } from 'react-map-gl/mapbox';
import type { StationMapEventData } from '@/features/stations/types';

vi.mock('react-map-gl/mapbox', () => ({
  useMap: vi.fn(),
}));

vi.mock('@/features/map/hooks', () => ({
  useLayerEvents: vi.fn(),
}));

vi.mock('@/features/stations', () => ({
  useStations: vi.fn(),
}));

describe('useStationEventHandlers', () => {
  let mockMap: Partial<MapRef>;
  let setHoveredStation: (station: StationMapEventData | null) => void;
  let setSelectedDepartureStationId: (stationId: string | null) => void;

  beforeEach(() => {
    mockMap = {
      getCanvas: vi.fn().mockReturnValue({ style: { cursor: '' } }),
    };

    setHoveredStation = vi.fn();
    setSelectedDepartureStationId = vi.fn();

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
    });
  });

  it('should use generic useLayerEvents hook', () => {
    renderHook(() => useStationEventHandlers('test-layer'));

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

    renderHook(() => useStationEventHandlers('test-layer'));

    expect(capturedHandlers).toBeDefined();
    expect(capturedHandlers!.onClick).toBeDefined();
  });

  it('should provide onMouseMove handler', () => {
    let capturedHandlers: mapHooks.LayerEventHandlers | undefined;
    vi.mocked(mapHooks.useLayerEvents).mockImplementation((options) => {
      capturedHandlers = options.handlers;
    });

    renderHook(() => useStationEventHandlers('test-layer'));

    expect(capturedHandlers).toBeDefined();
    expect(capturedHandlers!.onMouseMove).toBeDefined();
  });

  it('should provide onMouseLeave handler', () => {
    let capturedHandlers: mapHooks.LayerEventHandlers | undefined;
    vi.mocked(mapHooks.useLayerEvents).mockImplementation((options) => {
      capturedHandlers = options.handlers;
    });

    renderHook(() => useStationEventHandlers('test-layer'));

    expect(capturedHandlers).toBeDefined();
    expect(capturedHandlers!.onMouseLeave).toBeDefined();
  });

  it('should handle re-renders correctly', () => {
    const { rerender } = renderHook(() => useStationEventHandlers('test-layer'));

    rerender();

    expect(mapHooks.useLayerEvents).toHaveBeenCalled();
  });
});
