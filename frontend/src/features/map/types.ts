import type { MapRef } from 'react-map-gl/mapbox';

/**
 * View state for map positioning and camera
 */
export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;
  bearing?: number;
  padding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}

/**
 * Map context value exposed to consumers
 */
export interface MapContextValue {
  /** Reference to the Mapbox map instance */
  mapRef: React.RefObject<MapRef | null>;

  /** Current view state */
  viewState: ViewState;

  /** Update view state */
  setViewState: (viewState: Partial<ViewState>) => void;

  /** Fly to a specific location */
  flyTo: (options: { center: [number, number]; zoom?: number; duration?: number }) => void;

  /** Fit bounds to specific coordinates */
  fitBounds: (
    bounds: [[number, number], [number, number]],
    options?: { padding?: number; duration?: number }
  ) => void;

  /** Reset map to initial view */
  resetView: () => void;
}
