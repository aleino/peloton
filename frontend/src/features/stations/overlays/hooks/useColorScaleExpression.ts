import { useMemo } from 'react';
import {
  createLinearColorExpression,
  createLogColorExpression,
  createQuantileColorExpression,
  createDivergingColorExpression,
} from '@/utils/colorScales';
import type { ExpressionSpecification } from 'mapbox-gl';

export interface UseColorScaleExpressionOptions {
  minValue: number;
  maxValue: number;
  scaleType: 'linear' | 'log' | 'quantile';
  inputValue: ExpressionSpecification;
  isDiverging?: boolean;
  values?: number[];
}

/**
 * Create a Mapbox color expression using D3 scales (linear, log, quantile, or diverging)
 *
 * This hook generates a Mapbox GL expression for color mapping.
 *
 * @param options - Configuration for expression generation
 * @param options.minValue - Minimum value for the scale (or 5th percentile)
 * @param options.maxValue - Maximum value for the scale (or 95th percentile)
 * @param options.scaleType - Type of scale to use ('linear', 'log', 'quantile')
 * @param options.inputValue - Mapbox expression to use as input value
 * @param options.isDiverging - Whether to use a diverging color scale (default: false)
 * @param options.values - Array of all values (required for quantile and diverging scales)
 * @returns Mapbox expression for color mapping
 */
export const useColorScaleExpression = (
  options: UseColorScaleExpressionOptions
): string | ExpressionSpecification => {
  const { minValue, maxValue, scaleType, inputValue, isDiverging = false, values } = options;

  return useMemo((): string | ExpressionSpecification => {
    // Handle edge case where min equals max
    if (minValue === maxValue) {
      return '#cccccc';
    }

    // Use diverging scale if requested
    if (isDiverging) {
      if (!values) {
        console.warn('Values required for diverging scale');
        return '#cccccc';
      }
      return createDivergingColorExpression(values, inputValue);
    }

    switch (scaleType) {
      case 'linear':
        return createLinearColorExpression(minValue, maxValue, inputValue);
      case 'log':
        return createLogColorExpression(minValue, maxValue, inputValue);
      case 'quantile':
        if (!values) {
          console.warn('Values required for quantile scale');
          return '#cccccc';
        }
        return createQuantileColorExpression(values, inputValue);
    }
    return '#cccccc';
  }, [minValue, maxValue, scaleType, inputValue, isDiverging, values]);
};
