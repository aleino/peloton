import { describe, it, expect } from 'vitest';
import { calculateMapPadding, LAYOUT_DIMENSIONS } from '@/config/layout';

describe('layout configuration', () => {
  describe('LAYOUT_DIMENSIONS', () => {
    it('should have correct header dimensions', () => {
      expect(LAYOUT_DIMENSIONS.header.height).toBe(64);
      expect(LAYOUT_DIMENSIONS.header.topMargin).toBe(8);
    });

    it('should have correct panel dimensions', () => {
      expect(LAYOUT_DIMENSIONS.panel.widthPercent).toBe(39);
      expect(LAYOUT_DIMENSIONS.panel.leftMargin).toBe(8);
      expect(LAYOUT_DIMENSIONS.panel.rightMargin).toBe(8);
    });
  });

  describe('calculateMapPadding', () => {
    const viewportWidth = 1000;

    it('should calculate padding for left panel position', () => {
      const padding = calculateMapPadding('left', 39, viewportWidth);

      expect(padding).toEqual({
        top: 64,
        bottom: 0,
        left: 390, // 1000 * 0.39 = 390
        right: 0,
      });
    });

    it('should calculate padding for right panel position', () => {
      const padding = calculateMapPadding('right', 39, viewportWidth);

      expect(padding).toEqual({
        top: 64,
        bottom: 0,
        left: 0,
        right: 390,
      });
    });

    it('should calculate padding for no panel', () => {
      const padding = calculateMapPadding('none', 39, viewportWidth);

      expect(padding).toEqual({
        top: 64,
        bottom: 0,
        left: 0,
        right: 0,
      });
    });

    it('should use default panel width if not provided', () => {
      const padding = calculateMapPadding('left', undefined, viewportWidth);

      expect(padding.left).toBe(390); // Default 39%
    });

    it('should calculate correct panel width for custom percentage', () => {
      const padding = calculateMapPadding('left', 50, viewportWidth);

      expect(padding.left).toBe(500); // 1000 * 0.50 = 500
    });

    it('should calculate correct panel width for different viewport width', () => {
      const padding = calculateMapPadding('left', 39, 1920);

      expect(padding.left).toBe(748.8); // 1920 * 0.39 = 748.8
    });

    it('should always include header height in top padding', () => {
      const leftPadding = calculateMapPadding('left', 39, viewportWidth);
      const rightPadding = calculateMapPadding('right', 39, viewportWidth);
      const nonePadding = calculateMapPadding('none', 39, viewportWidth);

      expect(leftPadding.top).toBe(64);
      expect(rightPadding.top).toBe(64);
      expect(nonePadding.top).toBe(64);
    });

    it('should always have zero bottom padding', () => {
      const leftPadding = calculateMapPadding('left', 39, viewportWidth);
      const rightPadding = calculateMapPadding('right', 39, viewportWidth);
      const nonePadding = calculateMapPadding('none', 39, viewportWidth);

      expect(leftPadding.bottom).toBe(0);
      expect(rightPadding.bottom).toBe(0);
      expect(nonePadding.bottom).toBe(0);
    });

    it('should handle small viewport widths', () => {
      const padding = calculateMapPadding('left', 39, 320);

      expect(padding.left).toBe(124.8); // 320 * 0.39 = 124.8
    });

    it('should handle large viewport widths', () => {
      const padding = calculateMapPadding('left', 39, 3840);

      expect(padding.left).toBe(1497.6); // 3840 * 0.39 = 1497.6
    });
  });
});
