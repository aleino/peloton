import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MapProvider } from './MapContext';
import { useMapContext } from '../hooks/useMapContext';
import type { ReactNode } from 'react';
import { INITIAL_VIEW_STATE } from '@/config/mapbox';

const wrapper = ({ children }: { children: ReactNode }) => <MapProvider>{children}</MapProvider>;

describe('MapContext', () => {
  it('should provide initial view state', () => {
    const { result } = renderHook(() => useMapContext(), { wrapper });

    expect(result.current.viewState.longitude).toBe(INITIAL_VIEW_STATE.longitude);
    expect(result.current.viewState.latitude).toBe(INITIAL_VIEW_STATE.latitude);
    expect(result.current.viewState.zoom).toBe(INITIAL_VIEW_STATE.zoom);
  });

  it('should update view state', () => {
    const { result } = renderHook(() => useMapContext(), { wrapper });

    act(() => {
      result.current.setViewState({ zoom: 15 });
    });

    expect(result.current.viewState.zoom).toBe(15);
    expect(result.current.viewState.longitude).toBe(INITIAL_VIEW_STATE.longitude); // Unchanged
  });

  it('should provide map ref', () => {
    const { result } = renderHook(() => useMapContext(), { wrapper });

    expect(result.current.mapRef).toBeDefined();
    expect(result.current.mapRef.current).toBeNull(); // Map not mounted yet
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useMapContext());
    }).toThrow('useMapContext must be used within a MapProvider');
  });

  it('should provide control methods', () => {
    const { result } = renderHook(() => useMapContext(), { wrapper });

    expect(typeof result.current.flyTo).toBe('function');
    expect(typeof result.current.fitBounds).toBe('function');
    expect(typeof result.current.resetView).toBe('function');
  });
});
