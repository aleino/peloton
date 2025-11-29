import { describe, it, expect } from 'vitest';
import { calculateVariance } from '../calculateVariance';

describe('calculateVariance', () => {
  describe('edge cases', () => {
    it('should return 0 for invalid range (start > end)', () => {
      const values = [1, 2, 3, 4, 5];
      expect(calculateVariance(values, 3, 1)).toBe(0);
    });

    it('should return 0 for out of bounds start index', () => {
      const values = [1, 2, 3, 4, 5];
      expect(calculateVariance(values, -1, 2)).toBe(0);
    });

    it('should return 0 for out of bounds end index', () => {
      const values = [1, 2, 3, 4, 5];
      expect(calculateVariance(values, 0, 10)).toBe(0);
    });

    it('should return 0 for single value segment', () => {
      const values = [1, 2, 3, 4, 5];
      expect(calculateVariance(values, 2, 2)).toBe(0);
    });
  });

  describe('variance calculation', () => {
    it('should calculate variance for simple sequence', () => {
      const values = [1, 2, 3, 4, 5];
      const variance = calculateVariance(values, 0, 4);

      // Variance of [1,2,3,4,5]:
      // Mean = 3
      // Variance = ((1-3)² + (2-3)² + (3-3)² + (4-3)² + (5-3)²) = 4 + 1 + 0 + 1 + 4 = 10
      expect(variance).toBe(10);
    });

    it('should calculate variance for segment', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const variance = calculateVariance(values, 2, 5);

      // Segment: [3, 4, 5, 6]
      // Mean = 4.5
      // Variance = ((3-4.5)² + (4-4.5)² + (5-4.5)² + (6-4.5)²)
      //          = 2.25 + 0.25 + 0.25 + 2.25 = 5
      expect(variance).toBe(5);
    });

    it('should return 0 for identical values', () => {
      const values = [5, 5, 5, 5, 5];
      const variance = calculateVariance(values, 0, 4);
      expect(variance).toBe(0);
    });

    it('should handle floating point values', () => {
      const values = [1.5, 2.5, 3.5, 4.5];
      const variance = calculateVariance(values, 0, 3);

      // Mean = 3.0
      // Variance = ((1.5-3)² + (2.5-3)² + (3.5-3)² + (4.5-3)²)
      //          = 2.25 + 0.25 + 0.25 + 2.25 = 5
      expect(variance).toBe(5);
    });

    it('should handle negative values', () => {
      const values = [-2, -1, 0, 1, 2];
      const variance = calculateVariance(values, 0, 4);

      // Mean = 0
      // Variance = ((-2-0)² + (-1-0)² + (0-0)² + (1-0)² + (2-0)²)
      //          = 4 + 1 + 0 + 1 + 4 = 10
      expect(variance).toBe(10);
    });

    it('should be numerically stable', () => {
      // Test with values that might cause numerical instability
      const values = [1e10, 1e10 + 1, 1e10 + 2, 1e10 + 3];
      const variance = calculateVariance(values, 0, 3);

      // Despite large values, variance should be calculated correctly
      // Mean ≈ 1e10 + 1.5
      // Should be close to 1.25 (variance of [0, 1, 2, 3] shifted)
      expect(variance).toBeCloseTo(5, 5);
    });
  });
});
