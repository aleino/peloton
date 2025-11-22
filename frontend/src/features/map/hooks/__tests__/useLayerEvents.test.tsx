import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLayerEvents } from '../useLayerEvents';
import type { MapRef } from 'react-map-gl/mapbox';

const mockUseMap = vi.fn();

vi.mock('react-map-gl/mapbox', () => ({
  useMap: () => mockUseMap(),
}));

describe('useLayerEvents', () => {
  let mockMap: Partial<MapRef>;

  beforeEach(() => {
    mockMap = {
      getLayer: vi.fn().mockReturnValue({ id: 'test-layer' }),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
    };

    mockUseMap.mockReturnValue({ main: mockMap as MapRef });
  });

  it('should attach click handler', () => {
    const onClick = vi.fn();

    renderHook(() =>
      useLayerEvents({
        layerId: 'test-layer',
        handlers: { onClick },
      })
    );

    expect(mockMap.on).toHaveBeenCalledWith('click', 'test-layer', onClick);
  });

  it('should attach multiple handlers', () => {
    const onClick = vi.fn();
    const onMouseMove = vi.fn();

    renderHook(() =>
      useLayerEvents({
        layerId: 'test-layer',
        handlers: { onClick, onMouseMove },
      })
    );

    expect(mockMap.on).toHaveBeenCalledWith('click', 'test-layer', onClick);
    expect(mockMap.on).toHaveBeenCalledWith('mousemove', 'test-layer', onMouseMove);
  });

  it('should attach all handler types', () => {
    const onClick = vi.fn();
    const onMouseMove = vi.fn();
    const onMouseLeave = vi.fn();
    const onMouseEnter = vi.fn();

    renderHook(() =>
      useLayerEvents({
        layerId: 'test-layer',
        handlers: { onClick, onMouseMove, onMouseLeave, onMouseEnter },
      })
    );

    expect(mockMap.on).toHaveBeenCalledWith('click', 'test-layer', onClick);
    expect(mockMap.on).toHaveBeenCalledWith('mousemove', 'test-layer', onMouseMove);
    expect(mockMap.on).toHaveBeenCalledWith('mouseleave', 'test-layer', onMouseLeave);
    expect(mockMap.on).toHaveBeenCalledWith('mouseenter', 'test-layer', onMouseEnter);
  });

  it('should not attach handlers when disabled', () => {
    const onClick = vi.fn();

    renderHook(() =>
      useLayerEvents({
        layerId: 'test-layer',
        handlers: { onClick },
        enabled: false,
      })
    );

    expect(mockMap.on).not.toHaveBeenCalled();
  });

  it('should cleanup handlers on unmount', () => {
    const onClick = vi.fn();

    const { unmount } = renderHook(() =>
      useLayerEvents({
        layerId: 'test-layer',
        handlers: { onClick },
      })
    );

    unmount();

    expect(mockMap.off).toHaveBeenCalledWith('click', 'test-layer', onClick);
  });

  it('should cleanup all attached handlers on unmount', () => {
    const onClick = vi.fn();
    const onMouseMove = vi.fn();
    const onMouseLeave = vi.fn();
    const onMouseEnter = vi.fn();

    const { unmount } = renderHook(() =>
      useLayerEvents({
        layerId: 'test-layer',
        handlers: { onClick, onMouseMove, onMouseLeave, onMouseEnter },
      })
    );

    unmount();

    expect(mockMap.off).toHaveBeenCalledWith('click', 'test-layer', onClick);
    expect(mockMap.off).toHaveBeenCalledWith('mousemove', 'test-layer', onMouseMove);
    expect(mockMap.off).toHaveBeenCalledWith('mouseleave', 'test-layer', onMouseLeave);
    expect(mockMap.off).toHaveBeenCalledWith('mouseenter', 'test-layer', onMouseEnter);
  });

  it('should handle missing map gracefully', () => {
    mockUseMap.mockReturnValue({ main: null });

    const onClick = vi.fn();

    expect(() =>
      renderHook(() =>
        useLayerEvents({
          layerId: 'test-layer',
          handlers: { onClick },
        })
      )
    ).not.toThrow();
  });

  it('should handle unmount gracefully when layer is removed', () => {
    const onClick = vi.fn();
    const mockGetLayer = vi.fn();
    const mockOff = vi.fn();

    const customMockMap = {
      ...mockMap,
      getLayer: mockGetLayer,
      off: mockOff,
    };

    // Initially layer exists
    mockGetLayer.mockReturnValue({ id: 'test-layer' });
    mockUseMap.mockReturnValue({ main: customMockMap as MapRef });

    const { unmount } = renderHook(() =>
      useLayerEvents({
        layerId: 'test-layer',
        handlers: { onClick },
      })
    );

    // Simulate layer being removed before unmount
    mockGetLayer.mockReturnValue(null);

    // Should not throw when unmounting without layer
    expect(() => unmount()).not.toThrow();
  });
});
