import { Layer } from 'react-map-gl/mapbox';
import { useClusterEventHandlers, useColorScaleExpression } from '../hooks';
import { getClusterPropertyName } from '../utils';
import { useMapSource, useMapControls } from '@/features/map/hooks';
import type { LayerProps } from 'react-map-gl/mapbox';
import type { ExpressionSpecification } from 'mapbox-gl';
import type { FlattenedStationFeatureCollection } from '@/features/stations/api/useStationsQuery';
import {
  STATIONS_SOURCE_ID,
  STATIONS_CLUSTERS_LAYER_ID,
  STATIONS_CLUSTER_COUNT_LAYER_ID,
} from '@/features/stations/config/layers';

/**
 * Cluster layer component for station markers
 * Displays clustered markers at low zoom levels with dynamic coloring
 *
 * Color represents average metric value across all stations in cluster:
 * - Metric: tripCount, durationAvg, distanceAvg
 * - Direction: departures, arrivals, diff
 *
 * Responsibilities:
 * - Display cluster circles at low zoom levels
 * - Display cluster count labels
 * - Automatically show/hide based on zoom level
 * - Apply Viridis colors to clusters based on selected metric
 * - Handle click to zoom into cluster
 */
export const StationClustersLayer = () => {
  const geojsonData = useMapSource<FlattenedStationFeatureCollection>(STATIONS_SOURCE_ID);

  // Read metric and direction from map controls
  const { metric, direction } = useMapControls();

  // Determine which cluster property to use for coloring
  const clusterPropertyName = getClusterPropertyName(metric, direction);

  // Generate dynamic Mapbox expression: average = sum / point_count
  // Use coalesce to provide a fallback value of 0 if the property is null/undefined
  const inputValue: ExpressionSpecification = [
    '/',
    ['coalesce', ['get', clusterPropertyName], 0],
    ['get', 'point_count'],
  ];

  // Generate color scale expression based on average metric value
  const clusterColor = useColorScaleExpression({
    geojsonData,
    inputValue,
  });

  // Attach cluster event handlers (click to zoom)
  useClusterEventHandlers(STATIONS_CLUSTERS_LAYER_ID);

  // Cluster circle layer style
  const clusterLayerStyle: LayerProps = {
    id: STATIONS_CLUSTERS_LAYER_ID,
    type: 'circle',
    source: STATIONS_SOURCE_ID,
    filter: ['has', 'point_count'] as ExpressionSpecification,
    paint: {
      // Size clusters based on number of points
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20, // 20px radius for clusters with < 10 points
        10,
        30, // 30px radius for clusters with 10-50 points
        50,
        40, // 40px radius for clusters with 50+ points
      ] as ExpressionSpecification,
      // Use Viridis color from expression
      'circle-color': clusterColor,
      'circle-opacity': 0.8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  };

  // Cluster count label style
  const clusterCountLayerStyle: LayerProps = {
    id: STATIONS_CLUSTER_COUNT_LAYER_ID,
    type: 'symbol',
    source: STATIONS_SOURCE_ID,
    filter: ['has', 'point_count'] as ExpressionSpecification,
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 14,
    },
    paint: {
      'text-color': '#ffffff',
    },
  };

  return (
    <>
      <Layer {...clusterLayerStyle} />
      <Layer {...clusterCountLayerStyle} />
    </>
  );
};
