import { describe, it, expect } from 'vitest';
import {
  getDepartureRange,
  createLinearColorExpression,
  createLogColorExpression,
  createQuantileColorExpression,
  VIRIDIS_SCALE,
} from './colorScales';
import type { ExpressionSpecification } from 'mapbox-gl';

describe('colorScales', () => {
  describe('getDepartureRange', () => {
    it('should return min and max departure values', () => {
      const stations = [
        { properties: { totalDepartures: 100 } },
        { properties: { totalDepartures: 500 } },
        { properties: { totalDepartures: 200 } },
      ];

      const result = getDepartureRange(stations);

      expect(result.minDepartures).toBe(100);
      expect(result.maxDepartures).toBe(500);
    });

    it('should handle missing totalDepartures values', () => {
      const stations = [
        { properties: { totalDepartures: 100 } },
        { properties: {} },
        { properties: { totalDepartures: 200 } },
      ];

      const result = getDepartureRange(stations);

      expect(result.minDepartures).toBe(0);
      expect(result.maxDepartures).toBe(200);
    });

    it('should return zeros for empty array', () => {
      const result = getDepartureRange([]);

      expect(result.minDepartures).toBe(0);
      expect(result.maxDepartures).toBe(0);
    });

    it('should use percentiles when requested', () => {
      // Create a dataset with clear outliers
      const stations = [
        { properties: { totalDepartures: 1 } }, // Low outlier
        ...Array.from({ length: 20 }, (_, i) => ({
          properties: { totalDepartures: 100 + i * 10 },
        })),
        { properties: { totalDepartures: 9999 } }, // High outlier
      ];

      const result = getDepartureRange(stations, true);
      const resultWithoutPercentiles = getDepartureRange(stations, false);

      // Percentile range should be narrower than absolute range
      expect(result.maxDepartures - result.minDepartures).toBeLessThan(
        resultWithoutPercentiles.maxDepartures - resultWithoutPercentiles.minDepartures
      );

      // Should exclude extreme values
      expect(result.minDepartures).toBeGreaterThan(1);
      expect(result.maxDepartures).toBeLessThan(9999);
    });
  });

  describe('createLinearColorExpression', () => {
    const inputValue: ExpressionSpecification = ['get', 'totalDepartures'];

    it('should create interpolate expression with correct structure', () => {
      const expression = createLinearColorExpression(0, 1000, inputValue);

      expect(Array.isArray(expression)).toBe(true);
      expect(expression[0]).toBe('interpolate');
      expect(expression[1]).toEqual(['linear']);
      expect(expression[2]).toEqual(inputValue);
    });

    it('should return middle color when min equals max', () => {
      const expression = createLinearColorExpression(500, 500, inputValue);

      expect(expression).toBe(VIRIDIS_SCALE.stops[5]!.color);
    });

    it('should distribute colors evenly across the range', () => {
      const expression = createLinearColorExpression(
        0,
        1000,
        inputValue
      ) as ExpressionSpecification;

      // Check that we have value-color pairs
      expect(expression.length).toBeGreaterThan(10);

      // First value should be near 0
      expect(expression[3]).toBeLessThanOrEqual(10);
      // Last value should be near 1000
      expect(expression[expression.length - 2]).toBeGreaterThanOrEqual(990);
    });
  });

  describe('createLogColorExpression', () => {
    const inputValue: ExpressionSpecification = ['get', 'totalDepartures'];

    it('should create interpolate expression with correct structure', () => {
      const expression = createLogColorExpression(1, 1000, inputValue);

      expect(Array.isArray(expression)).toBe(true);
      expect(expression[0]).toBe('interpolate');
      expect(expression[1]).toEqual(['linear']);
      expect(expression[2]).toEqual(inputValue);
    });

    it('should return middle color when min equals max', () => {
      const expression = createLogColorExpression(500, 500, inputValue);

      expect(expression).toBe(VIRIDIS_SCALE.stops[5]!.color);
    });

    it('should handle zero min value by using 1', () => {
      const expression = createLogColorExpression(0, 1000, inputValue) as ExpressionSpecification;

      // Should still create a valid expression
      expect(Array.isArray(expression)).toBe(true);
      expect(expression[0]).toBe('interpolate');
    });

    it('should use logarithmic distribution', () => {
      const expression = createLogColorExpression(1, 1000, inputValue) as ExpressionSpecification;

      // Check that we have value-color pairs
      expect(expression.length).toBeGreaterThan(10);

      // Values should be distributed logarithmically
      // (smaller values should have smaller gaps)
      const firstValue = expression[3] as number;
      const secondValue = expression[5] as number;
      const lastValue = expression[expression.length - 2] as number;

      expect(secondValue - firstValue).toBeLessThan(lastValue - secondValue);
    });
  });

  describe('createQuantileColorExpression', () => {
    const inputValue: ExpressionSpecification = ['get', 'totalDepartures'];

    it('should create step expression with correct structure', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const expression = createQuantileColorExpression(values, inputValue);

      expect(Array.isArray(expression)).toBe(true);
      expect(expression[0]).toBe('step');
      expect(expression[1]).toEqual(inputValue);
      expect(expression[2]).toBe(VIRIDIS_SCALE.colors[0]); // Base color
    });

    it('should return fallback color for empty array', () => {
      const expression = createQuantileColorExpression([], inputValue);

      expect(expression).toBe('#cccccc');
    });

    it('should return middle color when all values are the same', () => {
      const values = [100, 100, 100, 100, 100];
      const expression = createQuantileColorExpression(values, inputValue);

      expect(expression).toBe(VIRIDIS_SCALE.stops[5]!.color);
    });

    it('should create quantile thresholds', () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1); // 1 to 100
      const expression = createQuantileColorExpression(
        values,
        inputValue
      ) as ExpressionSpecification;

      // Should have threshold-color pairs after the base color
      expect(expression.length).toBeGreaterThan(10);

      // Thresholds should be in ascending order
      const thresholds: number[] = [];
      for (let i = 3; i < expression.length; i += 2) {
        thresholds.push(expression[i] as number);
      }

      for (let i = 1; i < thresholds.length; i++) {
        expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1]!);
      }
    });

    it('should divide data into equal-sized bins', () => {
      // Create 100 values for easy calculation
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      const expression = createQuantileColorExpression(
        values,
        inputValue
      ) as ExpressionSpecification;

      // Extract thresholds
      const thresholds: number[] = [];
      for (let i = 3; i < expression.length; i += 2) {
        thresholds.push(expression[i] as number);
      }

      // Each bin should contain approximately the same number of values
      // For 100 values and 10 colors, we expect ~10 values per bin
      // Thresholds should be roughly at 10, 20, 30, etc.
      expect(thresholds.length).toBeGreaterThan(5); // At least some quantiles
      expect(thresholds[0]).toBeLessThan(20);
      expect(thresholds[thresholds.length - 1]).toBeGreaterThan(80);
    });
  });

  describe('VIRIDIS_SCALE', () => {
    it('should have 11 stops (t=0.0 to t=1.0 with 0.1 increments)', () => {
      expect(VIRIDIS_SCALE.stops).toHaveLength(11);
    });

    it('should have correct t-values', () => {
      const tValues = VIRIDIS_SCALE.tValues;
      expect(tValues[0]).toBe(0.0);
      expect(tValues[5]).toBe(0.5);
      expect(tValues[10]).toBe(1.0);
    });

    it('should start with deep purple', () => {
      expect(VIRIDIS_SCALE.stops[0]!.color).toBe('#440154');
      expect(VIRIDIS_SCALE.colors[0]).toBe('#440154');
    });

    it('should end with bright yellow-green', () => {
      expect(VIRIDIS_SCALE.stops[10]!.color).toBe('#fde725');
      expect(VIRIDIS_SCALE.colors[10]).toBe('#fde725');
    });

    it('should have middle color as teal', () => {
      expect(VIRIDIS_SCALE.stops[5]!.color).toBe('#1f9d88');
      expect(VIRIDIS_SCALE.colors[5]).toBe('#1f9d88');
    });

    it('should have paired t-values and colors', () => {
      VIRIDIS_SCALE.stops.forEach((stop, i) => {
        expect(stop.t).toBeCloseTo(i * 0.1, 10);
        expect(stop.color).toBeTruthy();
        expect(stop.color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });
});
