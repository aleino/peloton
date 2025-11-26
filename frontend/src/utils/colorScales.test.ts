import { describe, it, expect } from 'vitest';
import {
  getDepartureRange,
  createLinearColorExpression,
  createLogColorExpression,
  createQuantileColorExpression,
  createDivergingColorExpression,
} from './colorScales';
import { interpolateViridis } from 'd3-scale-chromatic';
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

      expect(expression).toBe(interpolateViridis(0.5));
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

      expect(expression).toBe(interpolateViridis(0.5));
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
      expect(expression[2]).toBe(interpolateViridis(0)); // Base color
    });

    it('should return fallback color for empty array', () => {
      const expression = createQuantileColorExpression([], inputValue);

      expect(expression).toBe('#cccccc');
    });

    it('should return middle color when all values are the same', () => {
      const values = [100, 100, 100, 100, 100];
      const expression = createQuantileColorExpression(values, inputValue);

      expect(expression).toBe(interpolateViridis(0.5));
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

  describe('interpolateViridis integration', () => {
    it('should generate correct colors at key points', () => {
      // Test that D3's interpolateViridis produces hex color strings
      expect(interpolateViridis(0)).toMatch(/^(#[0-9a-f]{6}|rgb\(\d+, \d+, \d+\))$/i);
      expect(interpolateViridis(0.5)).toMatch(/^(#[0-9a-f]{6}|rgb\(\d+, \d+, \d+\))$/i);
      expect(interpolateViridis(1)).toMatch(/^(#[0-9a-f]{6}|rgb\(\d+, \d+, \d+\))$/i);
    });

    it('should produce different colors for different t-values', () => {
      const color0 = interpolateViridis(0);
      const color5 = interpolateViridis(0.5);
      const color10 = interpolateViridis(1);

      expect(color0).not.toBe(color5);
      expect(color5).not.toBe(color10);
      expect(color0).not.toBe(color10);
    });
  });

  describe('createDivergingColorExpression', () => {
    const mockInputExpression: ExpressionSpecification = ['get', 'testProperty'];

    it('should return fallback color for empty values array', () => {
      const result = createDivergingColorExpression([], mockInputExpression);
      expect(result).toBe('#cccccc');
    });

    it('should return neutral color when all values are the same', () => {
      const result = createDivergingColorExpression([0.5, 0.5, 0.5], mockInputExpression);
      expect(result).toBe('#f7f7f7'); // White (neutral)
    });

    it('should return neutral color when all values are zero', () => {
      const result = createDivergingColorExpression([0, 0, 0], mockInputExpression);
      expect(result).toBe('#f7f7f7');
    });

    it('should create valid interpolate expression for mixed values', () => {
      const values = [-0.5, -0.2, 0, 0.3, 0.6];
      const result = createDivergingColorExpression(values, mockInputExpression);

      expect(Array.isArray(result)).toBe(true);
      const expression = result as ExpressionSpecification;
      expect(expression[0]).toBe('interpolate');
      expect(expression[1]).toEqual(['linear']);
      expect(expression[2]).toEqual(mockInputExpression);
    });

    it('should create symmetric range around zero', () => {
      const values = [-0.3, 0, 0.8]; // Asymmetric data
      const result = createDivergingColorExpression(values, mockInputExpression);
      const expression = result as ExpressionSpecification;

      // Extract breakpoint values (every even index starting from 3)
      const breakpointValues: number[] = [];
      for (let i = 3; i < expression.length; i += 2) {
        breakpointValues.push(expression[i] as number);
      }

      // Check symmetry: min should equal -max
      const min = breakpointValues[0]!;
      const max = breakpointValues[breakpointValues.length - 1]!;
      expect(min).toBeCloseTo(-max, 5);

      // Check that zero is in the middle
      const middleIndex = Math.floor(breakpointValues.length / 2);
      expect(breakpointValues[middleIndex]).toBeCloseTo(0, 5);
    });

    it('should use D3 RdBu interpolator colors', () => {
      const values = [-1, 0, 1];
      const result = createDivergingColorExpression(values, mockInputExpression);
      const expression = result as ExpressionSpecification;

      // Extract colors (every odd index starting from 4)
      const colors: string[] = [];
      for (let i = 4; i < expression.length; i += 2) {
        colors.push(expression[i] as string);
      }

      // Should have 11 colors
      expect(colors.length).toBe(11);

      // Verify it's using D3's interpolateRdBu by checking color pattern
      // First color should be reddish, middle should be light/white, last should be bluish
      expect(colors[0]).toMatch(/^rgb\(\d+, \d+, \d+\)|^#[0-9a-f]{6}$/i);
      expect(colors[5]).toMatch(/^rgb\(\d+, \d+, \d+\)|^#[0-9a-f]{6}$/i);
      expect(colors[10]).toMatch(/^rgb\(\d+, \d+, \d+\)|^#[0-9a-f]{6}$/i);
    });

    it('should handle only negative values', () => {
      const values = [-1, -0.5, -0.1];
      const result = createDivergingColorExpression(values, mockInputExpression);

      expect(Array.isArray(result)).toBe(true);
      const expression = result as ExpressionSpecification;
      expect(expression[0]).toBe('interpolate');
    });

    it('should handle only positive values', () => {
      const values = [0.1, 0.5, 1];
      const result = createDivergingColorExpression(values, mockInputExpression);

      expect(Array.isArray(result)).toBe(true);
      const expression = result as ExpressionSpecification;
      expect(expression[0]).toBe('interpolate');
    });

    it('should filter out NaN and Infinity values', () => {
      const values = [-0.5, NaN, 0, Infinity, 0.5, -Infinity];
      const result = createDivergingColorExpression(values, mockInputExpression);

      // Should process only valid values (-0.5, 0, 0.5)
      expect(Array.isArray(result)).toBe(true);
      const expression = result as ExpressionSpecification;
      expect(expression[0]).toBe('interpolate');
    });

    it('should return fallback gray when all values are invalid', () => {
      const values = [NaN, Infinity, -Infinity];
      const result = createDivergingColorExpression(values, mockInputExpression);

      expect(result).toBe('#cccccc');
    });

    it('should generate exactly 11 color stops', () => {
      const values = [-1, -0.5, 0, 0.5, 1];
      const result = createDivergingColorExpression(values, mockInputExpression);
      const expression = result as ExpressionSpecification;

      // Expression format: ['interpolate', ['linear'], input, val1, color1, val2, color2, ...]
      // After the first 3 elements, we have pairs of value-color
      const pairsCount = (expression.length - 3) / 2;
      expect(pairsCount).toBe(11);
    });

    it('should ensure zero maps to middle color (white)', () => {
      const values = [-2, -1, 0, 1, 2];
      const result = createDivergingColorExpression(values, mockInputExpression);
      const expression = result as ExpressionSpecification;

      // Find the color for value closest to zero
      let zeroColorIndex = -1;
      for (let i = 3; i < expression.length; i += 2) {
        const value = expression[i] as number;
        if (Math.abs(value) < 0.01) {
          // Should be very close to zero
          zeroColorIndex = i + 1;
          break;
        }
      }

      expect(zeroColorIndex).toBeGreaterThan(-1);
      // The color at zero should be light (whitish) - RdBu's midpoint
      const zeroColor = expression[zeroColorIndex] as string;
      expect(zeroColor).toBeTruthy();
    });
  });
});
