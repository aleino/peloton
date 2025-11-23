import { useCallback, useMemo } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { calculateMapPadding } from '@/config/layout';
import { MAP_ANIMATION } from '@/features/map/map.config';
import { flyToVisibleArea } from '@/features/map/utils/mapCamera';

export interface UseStationCenteringOptions {
  /** Position of the floating panel */
  panelPosition?: 'left' | 'right' | 'none';

  /** Width of panel as percentage (default: 39) */
  panelWidthPercent?: number;

  /** Zoom level when centering on station (default: 14) */
  targetZoom?: number;

  /** Animation duration in milliseconds (default: 1000) */
  duration?: number;
}

export interface UseStationCenteringReturn {
  /** Center map on a station's coordinates */
  centerOnStation: (coordinates: [number, number]) => void;

  /** Calculated padding for current layout */
  padding: { top: number; bottom: number; left: number; right: number };
}

/**
 * Hook for centering map on stations within the visible area
 *
 * Calculates padding based on floating UI elements and provides
 * a function to center the map on station coordinates.
 *
 * @example
 * ```typescript
 * const { centerOnStation } = useStationCentering({
 *   panelPosition: 'left',
 *   targetZoom: 14,
 * });
 *
 * // When station is selected
 * centerOnStation([24.9384, 60.1699]);
 * ```
 */
export function useStationCentering(
  options: UseStationCenteringOptions = {}
): UseStationCenteringReturn {
  const { main: map } = useMap();
  const {
    panelPosition = 'left',
    panelWidthPercent = 39,
    targetZoom = MAP_ANIMATION.stationCenteringZoom,
    duration = MAP_ANIMATION.defaultDuration,
  } = options;

  // Calculate padding (memoized, recalculates on window resize or panel position change)
  const padding = useMemo(() => {
    if (typeof window === 'undefined') {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    }

    return calculateMapPadding(panelPosition, panelWidthPercent, window.innerWidth);
  }, [panelPosition, panelWidthPercent]);

  // Center on station coordinates
  const centerOnStation = useCallback(
    (coordinates: [number, number], options?: { force?: boolean }) => {
      if (!map) return;

      const [longitude, latitude] = coordinates;
      const currentZoom = map.getZoom();

      // Only center if zoom level is too low (unless forced)
      const shouldSkipCentering =
        !options?.force && currentZoom >= MAP_ANIMATION.minimumZoomForSkipping;

      if (shouldSkipCentering) {
        return;
      }

      flyToVisibleArea(map, {
        longitude,
        latitude,
        zoom: targetZoom,
        duration,
        padding,
      });
    },
    [map, targetZoom, duration, padding]
  );

  return { centerOnStation, padding };
}
