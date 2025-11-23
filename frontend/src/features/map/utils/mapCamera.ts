import type { MapRef } from 'react-map-gl/mapbox';

export interface FlyToVisibleAreaOptions {
  /** Longitude of target point */
  longitude: number;

  /** Latitude of target point */
  latitude: number;

  /** Target zoom level (optional) */
  zoom?: number;

  /** Animation duration in milliseconds (default: 1000) */
  duration?: number;

  /** Padding to apply (accounts for UI overlays) */
  padding?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

/**
 * Fly to a location, centering it in the visible (non-overlaid) map area
 *
 * Uses Mapbox padding to offset the center point so that the target
 * location appears in the center of the visible map area, not obscured
 * by floating UI elements.
 *
 * @param map - MapRef instance from useMap() hook
 * @param options - Target coordinates, zoom, duration, and padding
 *
 * @example
 * ```typescript
 * const padding = calculateMapPadding('left', 39, window.innerWidth);
 * flyToVisibleArea(map, {
 *   longitude: 24.9384,
 *   latitude: 60.1699,
 *   zoom: 14,
 *   padding,
 * });
 * ```
 */
export function flyToVisibleArea(map: MapRef | undefined, options: FlyToVisibleAreaOptions): void {
  if (!map) {
    console.warn('Map instance not available');
    return;
  }

  const { longitude, latitude, zoom, duration = 1000, padding } = options;

  map.flyTo({
    center: [longitude, latitude],
    zoom: zoom ?? map.getZoom(),
    duration,
    padding: padding || { top: 0, bottom: 0, left: 0, right: 0 },
  });
}

/**
 * Jump to a location immediately (no animation)
 * Useful for initial positioning or when animation is not desired
 */
export function jumpToVisibleArea(
  map: MapRef | undefined,
  options: Omit<FlyToVisibleAreaOptions, 'duration'>
): void {
  if (!map) {
    console.warn('Map instance not available');
    return;
  }

  const { longitude, latitude, zoom, padding } = options;

  map.jumpTo({
    center: [longitude, latitude],
    zoom: zoom ?? map.getZoom(),
    padding: padding || { top: 0, bottom: 0, left: 0, right: 0 },
  });
}
