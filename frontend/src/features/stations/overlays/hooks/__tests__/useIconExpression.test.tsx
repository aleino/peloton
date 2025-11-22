import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIconExpression } from '../useIconExpression';
import * as reactMapGl from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import type { Map as MapboxMap } from 'mapbox-gl';

vi.mock('react-map-gl/mapbox', () => ({
  useMap: vi.fn(),
}));

describe('useIconExpression', () => {
  let mockMap: Partial<MapRef>;
  let mockMapboxMap: Partial<MapboxMap>;

  beforeEach(() => {
    mockMapboxMap = {
      setLayoutProperty: vi.fn(),
    };

    mockMap = {
      getLayer: vi.fn().mockReturnValue({ id: 'test-layer' }),
      getMap: vi.fn().mockReturnValue(mockMapboxMap),
      once: vi.fn(),
      off: vi.fn(),
    };

    vi.mocked(reactMapGl.useMap).mockReturnValue({
      main: mockMap as MapRef,
      current: mockMap as MapRef,
    });
  });

  it('should update icon expression', () => {
    renderHook(() =>
      useIconExpression({
        layerId: 'test-layer',
        selectedStationId: 'station-1',
        hoveredStationId: null,
      })
    );

    expect(mockMapboxMap.setLayoutProperty).toHaveBeenCalledWith(
      'test-layer',
      'icon-image',
      expect.any(Array)
    );
  });

  it('should use default icon when no state', () => {
    renderHook(() =>
      useIconExpression({
        layerId: 'test-layer',
        selectedStationId: null,
        hoveredStationId: null,
      })
    );

    expect(mockMapboxMap.setLayoutProperty).toHaveBeenCalledWith(
      'test-layer',
      'icon-image',
      'station-icon-default'
    );
  });

  it('should handle selected state', () => {
    renderHook(() =>
      useIconExpression({
        layerId: 'test-layer',
        selectedStationId: 'station-1',
        hoveredStationId: null,
      })
    );

    expect(mockMapboxMap.setLayoutProperty).toHaveBeenCalled();
    // Icon expression is an array when there's a state
    expect(mockMapboxMap.setLayoutProperty).toHaveBeenCalledWith(
      'test-layer',
      'icon-image',
      expect.any(Array)
    );
  });

  it('should handle hover state', () => {
    renderHook(() =>
      useIconExpression({
        layerId: 'test-layer',
        selectedStationId: null,
        hoveredStationId: 'station-1',
      })
    );

    expect(mockMapboxMap.setLayoutProperty).toHaveBeenCalled();
    expect(mockMapboxMap.setLayoutProperty).toHaveBeenCalledWith(
      'test-layer',
      'icon-image',
      expect.any(Array)
    );
  });

  it('should handle both hover and selected states', () => {
    renderHook(() =>
      useIconExpression({
        layerId: 'test-layer',
        selectedStationId: 'station-1',
        hoveredStationId: 'station-2',
      })
    );

    expect(mockMapboxMap.setLayoutProperty).toHaveBeenCalled();
    expect(mockMapboxMap.setLayoutProperty).toHaveBeenCalledWith(
      'test-layer',
      'icon-image',
      expect.any(Array)
    );
  });

  it('should handle missing map gracefully', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(reactMapGl.useMap).mockReturnValue({ main: null as any, current: null as any });

    expect(() =>
      renderHook(() =>
        useIconExpression({
          layerId: 'test-layer',
          selectedStationId: null,
          hoveredStationId: null,
        })
      )
    ).not.toThrow();
  });

  it('should update when states change', () => {
    const { rerender } = renderHook(
      (props: { selectedStationId: string | null; hoveredStationId: string | null }) =>
        useIconExpression({
          layerId: 'test-layer',
          selectedStationId: props.selectedStationId,
          hoveredStationId: props.hoveredStationId,
        }),
      {
        initialProps: {
          selectedStationId: null as string | null,
          hoveredStationId: null as string | null,
        },
      }
    );

    expect(mockMapboxMap.setLayoutProperty).toHaveBeenCalledTimes(1);

    rerender({
      selectedStationId: 'station-1' as string | null,
      hoveredStationId: null as string | null,
    });

    expect(mockMapboxMap.setLayoutProperty).toHaveBeenCalledTimes(2);
  });
});
