import type { MapRef } from 'react-map-gl/mapbox';

export interface BatchFeatureStateUpdate {
  featureId: string | number;
  state: Record<string, unknown>;
}

/**
 * Apply feature states in batch for better performance
 * Triggers single repaint after all updates
 *
 * @param map - MapRef from react-map-gl
 * @param sourceId - ID of the source containing features
 * @param updates - Array of feature state updates to apply
 *
 * @example
 * batchUpdateFeatureStates(map, 'stations-source', [
 *   { featureId: 'station-1', state: { hover: true } },
 *   { featureId: 'station-2', state: { selected: true } },
 * ]);
 */
export const batchUpdateFeatureStates = (
  map: MapRef,
  sourceId: string,
  updates: BatchFeatureStateUpdate[]
): void => {
  updates.forEach(({ featureId, state }) => {
    try {
      map.setFeatureState({ source: sourceId, id: featureId }, state);
    } catch (error) {
      // Silently ignore errors for features that don't exist (e.g., clusters)
      console.warn(`Failed to set feature state for feature ${featureId}:`, error);
    }
  });

  // Trigger single repaint after all updates
  map.triggerRepaint();
};

/**
 * Clear specific feature state properties for all features
 * Useful for resetting hover/selection states
 *
 * @param map - MapRef from react-map-gl
 * @param sourceId - ID of the source containing features
 * @param featureIds - Array of feature IDs to clear
 * @param properties - Array of property names to remove
 *
 * @example
 * clearFeatureStateProperties(map, 'stations-source',
 *   ['station-1', 'station-2'],
 *   ['hover', 'selected']
 * );
 */
export const clearFeatureStateProperties = (
  map: MapRef,
  sourceId: string,
  featureIds: (string | number)[],
  properties: string[]
): void => {
  featureIds.forEach((featureId) => {
    properties.forEach((property) => {
      map.removeFeatureState({ source: sourceId, id: featureId }, property);
    });
  });
};

/**
 * Clear all feature states for a source
 * Use with caution - this removes ALL feature states
 *
 * @param map - MapRef from react-map-gl
 * @param sourceId - ID of the source to clear
 *
 * @example
 * clearAllFeatureStates(map, 'stations-source');
 */
export const clearAllFeatureStates = (map: MapRef, sourceId: string): void => {
  map.removeFeatureState({ source: sourceId });
};
