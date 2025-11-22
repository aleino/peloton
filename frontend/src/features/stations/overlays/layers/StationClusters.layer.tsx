import { Layer } from 'react-map-gl/mapbox';
import { useClusterEventHandlers, useColorScaleExpression } from '../hooks';
import { useMapSource } from '@/features/map/hooks';
import type { LayerProps } from 'react-map-gl/mapbox';
import type { ExpressionSpecification } from 'mapbox-gl';
import type { StationFeatureCollection } from '@peloton/shared';
import {
  STATIONS_SOURCE_ID,
  STATIONS_CLUSTERS_LAYER_ID,
  STATIONS_CLUSTER_COUNT_LAYER_ID,
} from '@/features/stations/config/layers';

/**
 * Cluster layer component for station markers
 * Displays clustered markers at low zoom levels for better performance
 *
 * Responsibilities:
 * - Display cluster circles at low zoom levels
 * - Display cluster count labels
 * - Automatically show/hide based on zoom level
 * - Apply Viridis colors to clusters based on average departures
 * - Handle click to zoom into cluster
 */
export const StationClustersLayer = () => {
  const geojsonData = useMapSource<StationFeatureCollection>(STATIONS_SOURCE_ID);

  // Generate color scale expression based on average departures
  // Average = sumDepartures / point_count
  const clusterColor = useColorScaleExpression({
    geojsonData,
    inputValue: ['/', ['get', 'sumDepartures'], ['get', 'point_count']],
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
