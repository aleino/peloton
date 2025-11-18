import { createContext, useRef, useState, useCallback, type ReactNode } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';
import { INITIAL_VIEW_STATE } from '@/config/mapbox';
import type { MapContextValue, ViewState } from '../types';

/**
 * Map context for sharing map instance and state
 */
export const MapContext = createContext<MapContextValue | null>(null);

interface MapProviderProps {
  children: ReactNode;
}

/**
 * Provider component for map context
 *
 * Manages the Mapbox map instance and view state, providing
 * access to map controls throughout the component tree.
 *
 * @example
 * ```tsx
 * <MapProvider>
 *   <App />
 * </MapProvider>
 * ```
 */
export const MapProvider = ({ children }: MapProviderProps) => {
  const mapRef = useRef<MapRef>(null);

  const [viewState, setViewStateInternal] = useState<ViewState>({
    ...INITIAL_VIEW_STATE,
  });

  /**
   * Update view state (partial updates supported)
   */
  const setViewState = useCallback((newViewState: Partial<ViewState>) => {
    setViewStateInternal((prev) => ({
      ...prev,
      ...newViewState,
    }));
  }, []);

  /**
   * Fly to a specific location with animation
   */
  const flyTo = useCallback(
    (options: { center: [number, number]; zoom?: number; duration?: number }) => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      map.flyTo({
        center: options.center,
        zoom: options.zoom ?? viewState.zoom,
        duration: options.duration ?? 1500,
      });
    },
    [viewState.zoom]
  );

  /**
   * Fit map to specific bounds
   */
  const fitBounds = useCallback(
    (
      bounds: [[number, number], [number, number]],
      options?: { padding?: number; duration?: number }
    ) => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      map.fitBounds(bounds, {
        padding: options?.padding ?? 50,
        duration: options?.duration ?? 1000,
      });
    },
    []
  );

  /**
   * Reset map to initial view state
   */
  const resetView = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    map.flyTo({
      center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
      zoom: INITIAL_VIEW_STATE.zoom,
      pitch: INITIAL_VIEW_STATE.pitch,
      bearing: INITIAL_VIEW_STATE.bearing,
      duration: 1500,
    });
  }, []);

  const value: MapContextValue = {
    mapRef,
    viewState,
    setViewState,
    flyTo,
    fitBounds,
    resetView,
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};
