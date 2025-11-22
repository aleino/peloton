import { useEffect } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { waitForLayer, batchUpdateFeatureStates } from '../utils';

export interface FeatureStateUpdate<T extends Record<string, unknown>> {
  featureId: string | number;
  state: T;
}

export interface UseMapFeatureStateOptions<T extends Record<string, unknown>> {
  sourceId: string;
  layerId: string;
  updates: FeatureStateUpdate<T>[];
  enabled?: boolean;
}

/**
 * Generic hook for batched feature state updates
 * Works with any layer type and state shape
 *
 * @param options - Configuration for feature state updates
 * @param options.sourceId - ID of the source containing features
 * @param options.layerId - ID of the layer (used for readiness check)
 * @param options.updates - Array of feature state updates to apply
 * @param options.enabled - Whether updates are enabled (default: true)
 *
 * @example Basic usage with typed states
 * interface StationState {
 *   hover: boolean;
 *   selected: boolean;
 *   stationColor: string;
 *   stationClusterColor: string;
 * }
 *
 * useMapFeatureState<StationState>({
 *   sourceId: 'stations-source',
 *   layerId: 'stations-layer',
 *   updates: [
 *     { featureId: 'station-1', state: { hover: true } },
 *     { featureId: 'station-2', state: { selected: true } },
 *   ],
 * });
 *
 * @example Conditional updates
 * useMapFeatureState({
 *   sourceId: 'routes-source',
 *   layerId: 'routes-layer',
 *   updates: routeUpdates,
 *   enabled: showRoutes, // Only apply when routes are visible
 * });
 */
export const useMapFeatureState = <T extends Record<string, unknown>>(
  options: UseMapFeatureStateOptions<T>
): void => {
  const { sourceId, layerId, updates, enabled = true } = options;
  const { main: map } = useMap();

  useEffect(() => {
    if (!map || !enabled || updates.length === 0) return;

    return waitForLayer(map, layerId, () => {
      batchUpdateFeatureStates(map, sourceId, updates);
    });
  }, [map, sourceId, layerId, updates, enabled]);
};
