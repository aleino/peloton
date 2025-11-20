import type { MapRef } from 'react-map-gl/mapbox';

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;
  bearing?: number;
}

/**
 * Reset map to initial view state with animation
 *
 * @param mapRef - Reference to the map instance
 * @param initialViewState - Initial view state to reset to
 * @param duration - Animation duration in milliseconds (default: 1500)
 *
 * @example
 * ```tsx
 * const { main } = useMap();
 * resetView(main, INITIAL_VIEW_STATE);
 * ```
 */
export const resetView = (
  mapRef: MapRef | undefined,
  initialViewState: ViewState,
  duration = 1500
) => {
  if (!mapRef) return;

  mapRef.flyTo({
    center: [initialViewState.longitude, initialViewState.latitude],
    zoom: initialViewState.zoom,
    pitch: initialViewState.pitch ?? 0,
    bearing: initialViewState.bearing ?? 0,
    duration,
  });
};
