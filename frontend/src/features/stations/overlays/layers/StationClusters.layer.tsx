import { useMemo } from 'react';
import { Layer } from 'react-map-gl/mapbox';
import { useClusterEventHandlers, useColorScaleExpression } from '../hooks';
import { getClusterPropertyName, getStationPropertyName } from '../utils';
import { useMapSource, useMapControls } from '@/features/map/hooks';
import type { LayerProps } from 'react-map-gl/mapbox';
import type { ExpressionSpecification } from 'mapbox-gl';
import type {
  FlattenedStationFeatureCollection,
  FlattenedStationFeatureProperties,
} from '@/features/stations/api/useStationsQuery';
import {
  STATIONS_SOURCE_ID,
  STATIONS_CLUSTERS_LAYER_ID,
  STATIONS_CLUSTER_COUNT_LAYER_ID,
} from '@/features/stations/config/layers';
import { useAppSelector } from '@/store/hooks';
import { selectColorScaleType } from '@/features/settings/settings.store';

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
  const scaleType = useAppSelector(selectColorScaleType);

  // Determine which cluster property to use for coloring
  const clusterPropertyName = getClusterPropertyName(metric, direction);

  // Generate dynamic Mapbox expression: average = sum / point_count
  // Use coalesce to provide a fallback value of 0 if the property is null/undefined
  // Use max(point_count, 1) to avoid division by zero
  const inputValue: ExpressionSpecification = [
    '/',
    ['coalesce', ['get', clusterPropertyName], 0],
    ['max', ['get', 'point_count'], 1],
  ];

  // Calculate stats for color scale (based on individual stations)
  // We use the same scale as individual stations so clusters are comparable
  const propertyName = getStationPropertyName(metric, direction);
  const { min, max, values } = useMemo(() => {
    if (!geojsonData || geojsonData.features.length === 0) {
      return { min: 0, max: 0, values: [] };
    }

    const vals = geojsonData.features.map((f) => {
      const value = f.properties[propertyName as keyof FlattenedStationFeatureProperties];
      return (value as number | undefined) ?? 0;
    });

    if (vals.length === 0) {
      return { min: 0, max: 0, values: [] };
    }

    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);

    // Calculate percentiles for linear/log scales to avoid outliers
    const sorted = [...vals].sort((a, b) => a - b);
    const p5Index = Math.max(0, Math.floor(sorted.length * 0.05));
    const p95Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
    const p5Value = sorted[p5Index] ?? minVal;
    const p95Value = sorted[p95Index] ?? maxVal;

    return {
      min: p5Value,
      max: p95Value,
      values: vals,
    };
  }, [geojsonData, propertyName]);

  // Generate color scale expression based on average metric value
  const clusterColor = useColorScaleExpression({
    minValue: min,
    maxValue: max,
    scaleType,
    inputValue,
    isDiverging: direction === 'diff',
    values,
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
