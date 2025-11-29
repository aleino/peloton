import { useMemo } from 'react';
import { Layer } from 'react-map-gl/mapbox';
import { useStationEventHandlers, useColorScaleExpression } from '../hooks';
import { createCircleLayerStyle, getStationPropertyName } from '../utils';
import { useMapSource, useMapControls } from '@/features/map/hooks';
import type {
  FlattenedStationFeatureCollection,
  FlattenedStationFeatureProperties,
} from '@/features/stations/api/useStationsQuery';
import type { ExpressionSpecification } from 'mapbox-gl';
import { STATIONS_SOURCE_ID, STATIONS_CIRCLES_LAYER_ID } from '@/features/stations/config/layers';
import { useAppSelector } from '@/store/hooks';
import { selectColorScale } from '@/features/map/mapControls.store';

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

  // Read metric, direction, and color scale from map controls
  const { metric, direction } = useMapControls();
  const scaleType = useAppSelector(selectColorScale);

  // Determine which property to use for coloring
  const propertyName = getStationPropertyName(metric, direction);

  // Generate dynamic Mapbox expression for the selected metric
  const inputValue: ExpressionSpecification = ['get', propertyName];

  // Calculate stats for color scale
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
    const p1Index = Math.max(0, Math.floor(sorted.length * 0.01));
    const p99Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.99) - 1);
    const p1Value = sorted[p1Index] ?? minVal;
    const p99Value = sorted[p99Index] ?? maxVal;

    return {
      min: p1Value,
      max: p99Value,
      values: vals,
    };
  }, [geojsonData, propertyName]);

  // Generate color scale expression
  const stationColor = useColorScaleExpression({
    minValue: min,
    maxValue: max,
    scaleType,
    inputValue,
    isDiverging: direction === 'diff',
    values,
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
