import { useMemo } from 'react';
import {
  getDepartureRange,
  createLinearColorExpression,
  createLogColorExpression,
  createQuantileColorExpression,
} from '@/utils/colorScales';
import { useAppSelector } from '@/store/hooks';
import { selectColorScaleType } from '@/features/settings/settings.store';
import type { ExpressionSpecification } from 'mapbox-gl';
import type { StationFeatureCollection } from '@peloton/shared';

export interface UseColorScaleExpressionOptions {
  geojsonData: StationFeatureCollection | null;
  inputValue: ExpressionSpecification;
}

/**
 * Create a Mapbox color expression using D3 scales (linear, log, or quantile)
 *
 * This hook generates a Mapbox GL expression for color mapping using the Viridis
 * color scale. The scale type is read from the settings store and can be:
 * - 'linear': Even distribution across value range (scaleLinear)
 * - 'log': Logarithmic distribution for exponential data (scaleLog)
 * - 'quantile': Equal-sized buckets/deciles (scaleQuantile) - DEFAULT
 *
 * The color scale maps values to Viridis colors from purple (#440154) to yellow-green (#fde725).
 *
 * @param options - Configuration for expression generation
 * @param options.geojsonData - Station GeoJSON data to calculate scale from
 * @param options.inputValue - Mapbox expression to use as input value (e.g., ['get', 'totalDepartures'])
 * @returns Mapbox expression for color mapping, or fallback color if no data
 */
export const useColorScaleExpression = (
  options: UseColorScaleExpressionOptions
): string | ExpressionSpecification => {
  const { geojsonData, inputValue } = options;
  const scaleType = useAppSelector(selectColorScaleType);

  return useMemo((): string | ExpressionSpecification => {
    // Return fallback color if no data
    if (!geojsonData || geojsonData.features.length === 0) {
      return '#cccccc';
    }

    // Extract departure values from features
    const values = geojsonData.features.map((f) => f.properties.totalDepartures ?? 0);

    // Handle edge case where all stations have the same value
    if (values.length === 0 || (values.length === 1 && values[0] === 0)) {
      return '#cccccc';
    }

    // Choose scale based on settings
    switch (scaleType) {
      case 'linear': {
        const { minDepartures, maxDepartures } = getDepartureRange(
          geojsonData.features as Array<{ properties: { totalDepartures?: number } }>
        );
        return createLinearColorExpression(minDepartures, maxDepartures, inputValue);
      }

      case 'log': {
        const { minDepartures, maxDepartures } = getDepartureRange(
          geojsonData.features as Array<{ properties: { totalDepartures?: number } }>
        );
        return createLogColorExpression(minDepartures, maxDepartures, inputValue);
      }

      case 'quantile':
      default: {
        // Quantile scale uses all values to create equal-sized bins
        return createQuantileColorExpression(values, inputValue);
      }
    }
  }, [geojsonData, inputValue, scaleType]);
};
