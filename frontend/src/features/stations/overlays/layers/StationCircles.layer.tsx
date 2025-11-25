import { Layer } from 'react-map-gl/mapbox';
import { useStationEventHandlers, useColorScaleExpression } from '../hooks';
import { createCircleLayerStyle, getStationPropertyName } from '../utils';
import { useMapSource, useMapControls } from '@/features/map/hooks';
import type { FlattenedStationFeatureCollection } from '@/features/stations/api/useStationsQuery';
import type { ExpressionSpecification } from 'mapbox-gl';
import { STATIONS_SOURCE_ID, STATIONS_CIRCLES_LAYER_ID } from '@/features/stations/config/layers';

/**
 * Circle layer component for station markers
 * Displays Viridis-colored circles based on selected metric and direction
 *
 * Color adapts dynamically to user selections:
 * - Metric: tripCount, durationAvg, distanceAvg
 * - Direction: departures, arrivals, diff
 *
 * Responsibilities:
 * - Apply Viridis color scale to markers
 * - Handle hover and selection interaction states
 * - Attach event handlers (click, hover, leave)
 * - Define circle layer paint/layout properties
 */
export const StationCirclesLayer = () => {
  const geojsonData = useMapSource<FlattenedStationFeatureCollection>(STATIONS_SOURCE_ID);

  // Read metric and direction from map controls
  const { metric, direction } = useMapControls();

  // Determine which property to use for coloring
  const propertyName = getStationPropertyName(metric, direction);

  // Generate dynamic Mapbox expression for the selected metric
  const inputValue: ExpressionSpecification = ['get', propertyName];

  // Generate color scale expression
  const stationColor = useColorScaleExpression({
    geojsonData,
    inputValue,
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
