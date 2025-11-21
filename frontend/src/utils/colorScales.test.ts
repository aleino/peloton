import { describe, it, expect } from 'vitest';
import {
  normalizeValue,
  createViridisScale,
  getViridisColor,
  getDepartureRange,
  VIRIDIS_COLORS,
} from './colorScales';

describe('colorScales', () => {
  describe('normalizeValue', () => {
    it('should normalize value to 0-1 range', () => {
      expect(normalizeValue(50, 0, 100)).toBe(0.5);
      expect(normalizeValue(0, 0, 100)).toBe(0);
      expect(normalizeValue(100, 0, 100)).toBe(1);
    });

    it('should handle min === max', () => {
      expect(normalizeValue(50, 50, 50)).toBe(0.5);
    });

    it('should handle negative ranges', () => {
      expect(normalizeValue(0, -100, 100)).toBe(0.5);
      expect(normalizeValue(-50, -100, 100)).toBe(0.25);
    });
  });

  describe('createViridisScale', () => {
    it('should create a color scale function', () => {
      const scale = createViridisScale(0, 1000);
      expect(typeof scale).toBe('function');
    });

    it('should return different colors for different values', () => {
      const scale = createViridisScale(0, 1000);
      const color1 = scale(0);
      const color2 = scale(500);
      const color3 = scale(1000);

      expect(color1).not.toBe(color2);
      expect(color2).not.toBe(color3);
      expect(color1).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should clamp values outside domain', () => {
      const scale = createViridisScale(0, 100);
      const belowMin = scale(-50);
      const aboveMax = scale(200);
      const minColor = scale(0);
      const maxColor = scale(100);

      expect(belowMin).toBe(minColor);
      expect(aboveMax).toBe(maxColor);
    });

    it('should handle min === max gracefully', () => {
      const scale = createViridisScale(100, 100);
      expect(() => scale(100)).not.toThrow();
      expect(scale(100)).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should apply logarithmic transformation for skewed data', () => {
      const linearScale = createViridisScale(1, 10000, 'linear');
      const logScale = createViridisScale(1, 10000, 'log');

      // With log scale, middle values should get darker colors (more purple/blue)
      // than with linear scale, providing better color distribution
      const linearColor = linearScale(100);
      const logColor = logScale(100);

      expect(linearColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(logColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(linearColor).not.toBe(logColor);
    });

    it('should apply square root transformation', () => {
      const linearScale = createViridisScale(0, 10000, 'linear');
      const sqrtScale = createViridisScale(0, 10000, 'sqrt');

      const linearColor = linearScale(100);
      const sqrtColor = sqrtScale(100);

      expect(linearColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(sqrtColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(linearColor).not.toBe(sqrtColor);
    });

    it('should default to linear transformation', () => {
      const defaultScale = createViridisScale(0, 1000);
      const linearScale = createViridisScale(0, 1000, 'linear');

      expect(defaultScale(500)).toBe(linearScale(500));
    });

    it('should always use full Viridis color range from min to max', () => {
      // Test with any data range - should always get purple at min, yellow at max
      const scale = createViridisScale(10, 1000, 'log');

      const minColor = scale(10);
      const maxColor = scale(1000);

      // Min should be purple (near #440154)
      expect(minColor).toBe(VIRIDIS_COLORS.MIN);
      // Max should be yellow (near #fde725)
      expect(maxColor).toBe(VIRIDIS_COLORS.MAX);
    });

    it('should distribute colors evenly across transformed range', () => {
      const scale = createViridisScale(1, 10000, 'log');

      // Get colors at different points
      const colors = [
        scale(1), // min - purple
        scale(10), // ~16% log scale
        scale(100), // ~33% log scale
        scale(1000), // ~67% log scale
        scale(10000), // max - yellow
      ];

      // All should be different colors
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(5);

      // First should be purple, last should be yellow
      expect(colors[0]).toBe(VIRIDIS_COLORS.MIN);
      expect(colors[4]).toBe(VIRIDIS_COLORS.MAX);
    });
  });

  describe('getViridisColor', () => {
    it('should return purple for t=0', () => {
      const color = getViridisColor(0);
      expect(color).toBe(VIRIDIS_COLORS.MIN);
    });

    it('should return yellow for t=1', () => {
      const color = getViridisColor(1);
      expect(color).toBe(VIRIDIS_COLORS.MAX);
    });

    it('should return intermediate color for t=0.5', () => {
      const color = getViridisColor(0.5);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(color).not.toBe(VIRIDIS_COLORS.MIN);
      expect(color).not.toBe(VIRIDIS_COLORS.MAX);
    });

    it('should clamp t to [0, 1]', () => {
      expect(getViridisColor(-0.5)).toBe(getViridisColor(0));
      expect(getViridisColor(1.5)).toBe(getViridisColor(1));
    });

    it('should return hex color format', () => {
      const colors = [0, 0.25, 0.5, 0.75, 1].map(getViridisColor);
      colors.forEach((color) => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  describe('getDepartureRange', () => {
    it('should calculate min and max from station data', () => {
      const stations = [
        { properties: { totalDepartures: 100 } },
        { properties: { totalDepartures: 500 } },
        { properties: { totalDepartures: 1000 } },
      ];

      const range = getDepartureRange(stations);
      expect(range.minDepartures).toBe(100);
      expect(range.maxDepartures).toBe(1000);
    });

    it('should handle missing totalDepartures', () => {
      const stations = [
        { properties: { totalDepartures: 100 } },
        { properties: {} },
        { properties: { totalDepartures: 200 } },
      ];

      const range = getDepartureRange(stations);
      expect(range.minDepartures).toBe(0);
      expect(range.maxDepartures).toBe(200);
    });

    it('should handle empty array', () => {
      const range = getDepartureRange([]);
      expect(range.minDepartures).toBe(0);
      expect(range.maxDepartures).toBe(0);
    });

    it('should handle all stations with 0 departures', () => {
      const stations = [
        { properties: { totalDepartures: 0 } },
        { properties: { totalDepartures: 0 } },
      ];

      const range = getDepartureRange(stations);
      expect(range.minDepartures).toBe(0);
      expect(range.maxDepartures).toBe(0);
    });
  });

  describe('VIRIDIS_COLORS constants', () => {
    it('should have all color constants defined', () => {
      expect(VIRIDIS_COLORS.MIN).toBeDefined();
      expect(VIRIDIS_COLORS.QUARTER).toBeDefined();
      expect(VIRIDIS_COLORS.MIDDLE).toBeDefined();
      expect(VIRIDIS_COLORS.THREE_QUARTER).toBeDefined();
      expect(VIRIDIS_COLORS.MAX).toBeDefined();
    });

    it('should have valid hex colors', () => {
      Object.values(VIRIDIS_COLORS).forEach((color) => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });
});
