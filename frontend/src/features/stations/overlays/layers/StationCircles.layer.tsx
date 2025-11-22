import { Layer } from 'react-map-gl/mapbox';
import { useStationEventHandlers, useColorScaleExpression } from '../hooks';
import { createCircleLayerStyle } from '../utils';
import { useMapSource } from '@/features/map/hooks';
import type { StationFeatureCollection } from '@peloton/shared';
import type { ExpressionSpecification } from 'mapbox-gl';
import { STATIONS_SOURCE_ID, STATIONS_CIRCLES_LAYER_ID } from '@/features/stations/config/layers';

/**
 * Circle layer component for station markers
 * Displays Viridis-colored circles with hover/selection states
 *
 * Responsibilities:
 * - Apply Viridis color scale to markers
 * - Handle hover and selection interaction states
 * - Attach event handlers (click, hover, leave)
 * - Define circle layer paint/layout properties
 */
export const StationCirclesLayer = () => {
  const geojsonData = useMapSource<StationFeatureCollection>(STATIONS_SOURCE_ID);

  // Apply Viridis colors to feature states
  // Generate color scale expression based on total departures
  const stationColor = useColorScaleExpression({
    geojsonData,
    inputValue: ['get', 'totalDepartures'],
  });

  // Attach event handlers (manages hover state internally)
  useStationEventHandlers(STATIONS_CIRCLES_LAYER_ID, STATIONS_SOURCE_ID);

  // Get layer configuration from pure function (filter out clusters)
  const layerStyle = createCircleLayerStyle(stationColor, [
    '!',
    ['has', 'point_count'],
  ] as ExpressionSpecification);

  return <Layer {...layerStyle} />;
};
