import type { MapRef } from 'react-map-gl/mapbox';

type ReadyCallback = () => void | (() => void);

/**
 * Wait for map layer to be ready, then execute callback
 * Handles race conditions where layer might not exist yet
 *
 * @param map - MapRef from react-map-gl
 * @param layerId - ID of the layer to wait for
 * @param callback - Function to execute when ready, can return cleanup function
 * @returns Cleanup function to remove listeners
 *
 * @example
 * useEffect(() => {
 *   if (!map) return;
 *   return waitForLayer(map, 'my-layer', () => {
 *     console.log('Layer is ready!');
 *     return () => console.log('Cleanup');
 *   });
 * }, [map]);
 */
export const waitForLayer = (
  map: MapRef,
  layerId: string,
  callback: ReadyCallback
): (() => void) => {
  let cleanup: (() => void) | void;

  const checkAndExecute = () => {
    const layer = map.getLayer(layerId);
    if (layer) {
      cleanup = callback();
    }
  };

  // Try immediately in case layer already exists
  checkAndExecute();

  // If layer doesn't exist yet, wait for 'idle' event
  if (!map.getLayer(layerId)) {
    map.once('idle', checkAndExecute);
  }

  return () => {
    if (cleanup) cleanup();
    map.off('idle', checkAndExecute);
  };
};

/**
 * Wait for map source to be ready, then execute callback
 * Handles race conditions where source might not exist yet
 *
 * @param map - MapRef from react-map-gl
 * @param sourceId - ID of the source to wait for
 * @param callback - Function to execute when ready, can return cleanup function
 * @returns Cleanup function to remove listeners
 *
 * @example
 * useEffect(() => {
 *   if (!map) return;
 *   return waitForSource(map, 'my-source', () => {
 *     console.log('Source is ready!');
 *   });
 * }, [map]);
 */
export const waitForSource = (
  map: MapRef,
  sourceId: string,
  callback: ReadyCallback
): (() => void) => {
  let cleanup: (() => void) | void;

  const checkAndExecute = () => {
    const source = map.getSource(sourceId);
    if (source) {
      cleanup = callback();
    }
  };

  // Try immediately in case source already exists
  checkAndExecute();

  // If source doesn't exist yet, wait for 'idle' event
  if (!map.getSource(sourceId)) {
    map.once('idle', checkAndExecute);
  }

  return () => {
    if (cleanup) cleanup();
    map.off('idle', checkAndExecute);
  };
};
