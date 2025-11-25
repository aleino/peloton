import { useMemo } from 'react';
import {
  createLinearColorExpression,
  createLogColorExpression,
  createQuantileColorExpression,
} from '@/utils/colorScales';
import { useAppSelector } from '@/store/hooks';
import { selectColorScaleType } from '@/features/settings/settings.store';
import { useMapControls } from '@/features/map/hooks';
import type { Metric, Direction } from '@/features/map/types';
import type { ExpressionSpecification } from 'mapbox-gl';
import type {
  FlattenedStationFeatureCollection,
  FlattenedStationFeatureProperties,
} from '@/features/stations/api/useStationsQuery';

export interface UseColorScaleExpressionOptions {
  geojsonData: FlattenedStationFeatureCollection | null;
  inputValue: ExpressionSpecification;
}

/**
 * Get the flattened property name for a given metric and direction
 *
 * Maps user-selected metric and direction to the flattened property name
 * in FlattenedStationFeatureProperties.
 *
 * @param metric - Selected metric (tripCount, durationAvg, distanceAvg)
 * @param direction - Selected direction (departures, arrivals, diff)
 * @returns Property name to use in Mapbox expressions
 */
function getPropertyName(metric: Metric, direction: Direction): string {
  // Map 'arrivals' to 'returns' to match property names
  // For diff mode, we'll use departures for now (diff calculation comes later)
  const dir =
    direction === 'diff' ? 'departures' : direction === 'arrivals' ? 'returns' : direction;

  const propertyMap: Record<Metric, Record<'departures' | 'returns', string>> = {
    tripCount: {
      departures: 'departuresCount',
      returns: 'returnsCount',
    },
    durationAvg: {
      departures: 'departuresDurationAvg',
      returns: 'returnsDurationAvg',
    },
    distanceAvg: {
      departures: 'departuresDistanceAvg',
      returns: 'returnsDistanceAvg',
    },
  };

  return propertyMap[metric][dir as 'departures' | 'returns'];
}

/**
 * Create a Mapbox color expression using D3 scales (linear, log, or quantile)
 *
 * This hook generates a Mapbox GL expression for color mapping using the Viridis
 * color scale. The metric and direction are read from Redux state:
 * - Metric: tripCount, durationAvg, distanceAvg
 * - Direction: departures, arrivals, diff
 *
 * The scale type is read from settings and can be:
 * - 'linear': Even distribution across value range (scaleLinear)
 * - 'log': Logarithmic distribution for exponential data (scaleLog)
 * - 'quantile': Equal-sized buckets/deciles (scaleQuantile) - DEFAULT
 *
 * Note: Duration (durationAvg) and distance (distanceAvg) metrics always use quantile scale
 * regardless of the settings, as these continuous measurements benefit from equal-sized bins.
 * Only tripCount uses the user-selected scale type.
 *
 * The color scale maps values to Viridis colors from purple (#440154) to yellow-green (#fde725).
 *
 * @param options - Configuration for expression generation
 * @param options.geojsonData - Station GeoJSON data to calculate scale from
 * @param options.inputValue - Mapbox expression to use as input value
 * @returns Mapbox expression for color mapping, or fallback color if no data
 */
export const useColorScaleExpression = (
  options: UseColorScaleExpressionOptions
): string | ExpressionSpecification => {
  const { geojsonData, inputValue } = options;
  const scaleType = useAppSelector(selectColorScaleType);
  const { metric, direction } = useMapControls();

  return useMemo((): string | ExpressionSpecification => {
    // Return fallback color if no data
    if (!geojsonData || geojsonData.features.length === 0) {
      return '#cccccc';
    }

    // Determine which property to use for color scaling
    const propertyName = getPropertyName(metric, direction);

    // Extract values from the dynamic property
    const values = geojsonData.features.map((f) => {
      const value = f.properties[propertyName as keyof FlattenedStationFeatureProperties];
      return (value as number | undefined) ?? 0;
    });

    // Handle edge case where all stations have the same value
    if (values.length === 0) {
      return '#cccccc';
    }

    // Calculate min and max once to check for valid range
    const min = Math.min(...values);
    const max = Math.max(...values);

    // If min equals max (including all zeros), return fallback color
    if (min === max) {
      return '#cccccc';
    }

    // Calculate 5th and 95th percentiles to discard extreme outliers
    const sorted = [...values].sort((a, b) => a - b);
    const p5Index = Math.max(0, Math.floor(sorted.length * 0.05));
    const p95Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
    const p5Value = sorted[p5Index] ?? min;
    const p95Value = sorted[p95Index] ?? max;

    // Use quantile scale for durationAvg and distanceAvg metrics (better for continuous measurements)
    // Use settings-based scale for tripCount
    const effectiveScaleType =
      metric === 'durationAvg' || metric === 'distanceAvg' ? 'quantile' : scaleType;

    // Choose scale based on effective scale type
    switch (effectiveScaleType) {
      case 'linear': {
        return createLinearColorExpression(p5Value, p95Value, inputValue);
      }

      case 'log': {
        return createLogColorExpression(p5Value, p95Value, inputValue);
      }

      case 'quantile':
      default: {
        // Quantile scale uses all values (trimming handled internally)
        return createQuantileColorExpression(values, inputValue);
      }
    }
  }, [geojsonData, inputValue, scaleType, metric, direction]);
};
