import { useEffect } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import type { MapMouseEvent, MapTouchEvent } from 'mapbox-gl';
import { waitForLayer } from '../utils/mapReadyState';

export interface LayerEventHandlers {
  onClick?: (e: MapMouseEvent | MapTouchEvent) => void;
  onMouseMove?: (e: MapMouseEvent) => void;
  onMouseLeave?: () => void;
  onMouseEnter?: (e: MapMouseEvent) => void;
}

export interface UseLayerEventsOptions {
  layerId: string;
  handlers: LayerEventHandlers;
  enabled?: boolean;
}

/**
 * Generic hook for attaching events to any Mapbox layer
 * Handles layer readiness and cleanup automatically
 *
 * @param options - Configuration for event attachment
 * @param options.layerId - ID of the layer to attach events to
 * @param options.handlers - Event handler callbacks
 * @param options.enabled - Whether event attachment is enabled (default: true)
 *
 * @example
 * useLayerEvents({
 *   layerId: 'my-layer',
 *   handlers: {
 *     onClick: (e) => console.log('Clicked feature:', e.features?.[0]),
 *     onMouseMove: (e) => console.log('Hovering:', e.features?.[0]),
 *     onMouseLeave: () => console.log('Left layer'),
 *   },
 * });
 *
 * @example With conditional enabling
 * useLayerEvents({
 *   layerId: 'my-layer',
 *   handlers: { onClick: handleClick },
 *   enabled: isInteractive, // Only attach events when interactive
 * });
 */
export const useLayerEvents = (options: UseLayerEventsOptions): void => {
  const { layerId, handlers, enabled = true } = options;
  const { main: map } = useMap();

  // Destructure handlers for stable dependency tracking
  const { onClick, onMouseMove, onMouseLeave, onMouseEnter } = handlers;

  useEffect(() => {
    if (!map || !enabled) return;

    return waitForLayer(map, layerId, () => {
      // Attach event handlers
      if (onClick) {
        map.on('click', layerId, onClick);
      }
      if (onMouseMove) {
        map.on('mousemove', layerId, onMouseMove);
      }
      if (onMouseLeave) {
        map.on('mouseleave', layerId, onMouseLeave);
      }
      if (onMouseEnter) {
        map.on('mouseenter', layerId, onMouseEnter);
      } // Return cleanup function
      return () => {
        // Only remove if layer still exists (avoid warnings)
        if (map.getLayer(layerId)) {
          if (onClick) map.off('click', layerId, onClick);
          if (onMouseMove) map.off('mousemove', layerId, onMouseMove);
          if (onMouseLeave) map.off('mouseleave', layerId, onMouseLeave);
          if (onMouseEnter) map.off('mouseenter', layerId, onMouseEnter);
        }
      };
    });
  }, [map, layerId, onClick, onMouseMove, onMouseLeave, onMouseEnter, enabled]);
};
