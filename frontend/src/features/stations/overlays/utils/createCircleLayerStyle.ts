import type { LayerProps } from 'react-map-gl/mapbox';
import type { ExpressionSpecification } from 'mapbox-gl';
import {
  STATIONS_SOURCE_ID,
  STATIONS_CIRCLES_LAYER_ID,
  MARKER_RADIUS,
  MARKER_STROKE_WIDTH,
  MARKER_OPACITY,
  MARKER_STROKE_COLOR,
  MARKER_TRANSITION_DURATION,
} from '../config';

/**
 * Generate circle layer configuration for station markers
 * Pure function - no side effects, fully testable
 *
 * @param filter - Optional Mapbox expression for filtering features
 */
export const createCircleLayerStyle = (
  colorExpression: ExpressionSpecification | string,
  filter?: ExpressionSpecification
): LayerProps => ({
  id: STATIONS_CIRCLES_LAYER_ID,
  type: 'circle',
  source: STATIONS_SOURCE_ID,
  ...(filter ? { filter } : {}),
  paint: {
    'circle-radius': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      MARKER_RADIUS.SELECTED,
      ['boolean', ['feature-state', 'hover'], false],
      MARKER_RADIUS.HOVER,
      MARKER_RADIUS.DEFAULT,
    ] as ExpressionSpecification,

    'circle-color': ['coalesce', colorExpression, '#ffffff'] as ExpressionSpecification,

    'circle-opacity': MARKER_OPACITY,

    'circle-stroke-width': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      MARKER_STROKE_WIDTH.SELECTED,
      ['boolean', ['feature-state', 'hover'], false],
      MARKER_STROKE_WIDTH.HOVER,
      MARKER_STROKE_WIDTH.DEFAULT,
    ] as ExpressionSpecification,

    'circle-stroke-color': MARKER_STROKE_COLOR,

    'circle-radius-transition': {
      duration: MARKER_TRANSITION_DURATION,
      delay: 0,
    },
    'circle-stroke-width-transition': {
      duration: MARKER_TRANSITION_DURATION,
      delay: 0,
    },
  },
});
