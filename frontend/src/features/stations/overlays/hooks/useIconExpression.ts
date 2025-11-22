import { useEffect } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { waitForLayer } from '@/features/map/utils';
import { createIconExpression } from '../utils';

export interface UseIconExpressionOptions {
  layerId: string;
  selectedStationId: string | null;
  hoveredStationId: string | null;
}

/**
 * Update icon expression based on hover and selection states
 * Uses pure createIconExpression function from utils
 *
 * @param options - Configuration for icon expression
 * @param options.layerId - ID of the symbol layer to update
 * @param options.selectedStationId - Currently selected station ID (or null)
 * @param options.hoveredStationId - Currently hovered station ID (or null)
 *
 * @example
 * const { hoveredStation, selectedDepartureStationId } = useStations();
 *
 * useIconExpression({
 *   layerId: STATIONS_SYMBOLS_LAYER_ID,
 *   selectedStationId: selectedDepartureStationId,
 *   hoveredStationId: hoveredStation?.stationId ?? null,
 * });
 */
export const useIconExpression = (options: UseIconExpressionOptions): void => {
  const { layerId, selectedStationId, hoveredStationId } = options;
  const { main: map } = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    return waitForLayer(map, layerId, () => {
      const iconExpression = createIconExpression(selectedStationId, hoveredStationId);
      map.getMap().setLayoutProperty(layerId, 'icon-image', iconExpression);
    });
  }, [map, layerId, selectedStationId, hoveredStationId]);
};
