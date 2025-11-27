import type { LayerProps } from 'react-map-gl/mapbox';
import type { ExpressionSpecification } from 'mapbox-gl';
import { STATIONS_SOURCE_ID, STATIONS_SYMBOLS_LAYER_ID, TRANSITION_DURATION } from '../config';

/**
 * Generate symbol layer configuration for station icons
 * Pure function - no side effects, fully testable
 *
 * @param filter - Optional Mapbox expression for filtering features
 */
export const createSymbolLayerStyle = (filter?: ExpressionSpecification): LayerProps => ({
  id: STATIONS_SYMBOLS_LAYER_ID,
  type: 'symbol',
  source: STATIONS_SOURCE_ID,
  ...(filter ? { filter } : {}),
  layout: {
    'icon-image': 'station-icon-default', // Will be updated by useIconExpression
    'icon-size': 1,
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
  },
  paint: {
    'icon-opacity': 1,
    'icon-opacity-transition': {
      duration: TRANSITION_DURATION.LAYER_OPACITY,
      delay: 0,
    },
  },
});
