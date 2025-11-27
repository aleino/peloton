import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { useMapControls } from '@/features/map/hooks';
import type { MapStyle } from '@/features/map/types';

/**
 * Hook to manage water layer ordering for Voronoi visualization
 *
 * This hook saves the original layer order when the map first loads,
 * then provides functions to:
 * - Move water layers to the top (for Voronoi mode)
 * - Restore original layer order (for points mode)
 *
 * Technical Details:
 * - Saves layer order once per style (resets when style changes)
 * - Water layers are identified by 'water' in their ID
 * - Uses Mapbox's moveLayer API to reorder without recreating layers
 * - Returns the first water layer ID for use as beforeId
 */
export const useWaterLayerOrder = () => {
  const { main: map } = useMap();
  const { style } = useMapControls();

  // Store the original layer order (array of layer IDs)
  const originalOrderRef = useRef<string[] | null>(null);
  // Track which style the saved order belongs to
  const savedStyleRef = useRef<MapStyle | null>(null);
  // Track if water layers are currently moved to top
  const waterLayersMovedRef = useRef(false);

  /**
   * Save the original layer order from the map style
   * Only saves once per style
   */
  const saveOriginalOrder = useCallback(() => {
    if (!map) {
      return false;
    }

    const mapInstance = map.getMap();
    if (!mapInstance.isStyleLoaded()) {
      return false;
    }

    // Only save if we haven't saved for this style yet
    if (savedStyleRef.current === style && originalOrderRef.current) {
      return true;
    }

    const layers = mapInstance.getStyle()?.layers;
    if (!layers) {
      return false;
    }

    originalOrderRef.current = layers.map((layer) => layer.id);
    savedStyleRef.current = style;
    waterLayersMovedRef.current = false;

    return true;
  }, [map, style]);

  /**
   * Get all water layer IDs from the current style
   */
  const getWaterLayerIds = useCallback((): string[] => {
    if (!map) {
      return [];
    }

    const mapInstance = map.getMap();
    const layers = mapInstance.getStyle()?.layers || [];

    return layers.filter((layer) => layer.id.includes('water')).map((layer) => layer.id);
  }, [map]);

  /**
   * Move all water layers to the top of the layer stack
   * Returns the first water layer ID for use as beforeId
   */
  const moveWaterLayersToTop = useCallback((): string | undefined => {
    if (!map) {
      return undefined;
    }

    const mapInstance = map.getMap();
    if (!mapInstance.isStyleLoaded()) {
      return undefined;
    }

    // Save original order first if not already saved
    saveOriginalOrder();

    const waterLayerIds = getWaterLayerIds();
    if (waterLayerIds.length === 0) {
      return undefined;
    }

    // Move each water layer to the top (in order)
    waterLayerIds.forEach((layerId) => {
      try {
        if (mapInstance.getLayer(layerId)) {
          // moveLayer with no second argument moves to top
          mapInstance.moveLayer(layerId);
        }
      } catch (error) {
        console.error(`Failed to move water layer ${layerId}:`, error);
      }
    });

    waterLayersMovedRef.current = true;

    // Return the first water layer ID (now at top, but first among water layers)
    return waterLayerIds[0];
  }, [map, saveOriginalOrder, getWaterLayerIds]);

  /**
   * Restore the original layer order
   */
  const restoreOriginalOrder = useCallback(() => {
    if (!map || !originalOrderRef.current) {
      return;
    }
    if (!waterLayersMovedRef.current) {
      return; // Nothing to restore
    }

    const mapInstance = map.getMap();
    if (!mapInstance.isStyleLoaded()) {
      return;
    }

    const originalOrder = originalOrderRef.current;
    const currentLayers = mapInstance.getStyle()?.layers || [];
    const currentLayerIds = new Set(currentLayers.map((l) => l.id));

    // Rebuild the layer order by moving layers to their original positions
    // We iterate through original order and move each layer after the previous one
    let previousLayerId: string | undefined;

    for (const layerId of originalOrder) {
      // Skip layers that no longer exist
      if (!currentLayerIds.has(layerId)) {
        continue;
      }

      try {
        if (mapInstance.getLayer(layerId)) {
          if (previousLayerId) {
            // Move this layer after the previous one
            // In Mapbox, moveLayer(id, beforeId) moves layer BEFORE beforeId
            // So we need to find the layer that should come AFTER this one
            const currentIndex = originalOrder.indexOf(layerId);
            const nextLayerId = originalOrder
              .slice(currentIndex + 1)
              .find((id) => currentLayerIds.has(id));

            if (nextLayerId) {
              mapInstance.moveLayer(layerId, nextLayerId);
            }
          }
          previousLayerId = layerId;
        }
      } catch (error) {
        console.error(`Failed to restore layer order for ${layerId}:`, error);
      }
    }

    waterLayersMovedRef.current = false;
  }, [map]);

  /**
   * Get the first water layer ID (useful for beforeId)
   */
  const getFirstWaterLayerId = useCallback((): string | undefined => {
    const waterLayerIds = getWaterLayerIds();
    return waterLayerIds[0];
  }, [getWaterLayerIds]);

  /**
   * Check if water layers are currently moved to top
   */
  const areWaterLayersMoved = useCallback(() => {
    return waterLayersMovedRef.current;
  }, []);

  // Reset state when style changes
  useEffect(() => {
    if (savedStyleRef.current !== style) {
      originalOrderRef.current = null;
      savedStyleRef.current = null;
      waterLayersMovedRef.current = false;
    }
  }, [style]);

  return {
    saveOriginalOrder,
    moveWaterLayersToTop,
    restoreOriginalOrder,
    getFirstWaterLayerId,
    getWaterLayerIds,
    areWaterLayersMoved,
  };
};
