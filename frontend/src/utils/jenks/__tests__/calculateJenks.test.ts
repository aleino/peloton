import { describe, it, expect } from 'vitest';
import { calculateJenks } from '../calculateJenks';

describe('calculateJenks', () => {
  describe('input validation', () => {
    it('should throw error for numClasses < 1', () => {
      expect(() => calculateJenks([1, 2, 3], 0)).toThrow('Number of classes must be at least 1');
    });

    it('should throw error for non-finite values', () => {
      expect(() => calculateJenks([1, 2, NaN, 4], 3)).toThrow('All values must be finite numbers');

      expect(() => calculateJenks([1, 2, Infinity, 4], 3)).toThrow(
        'All values must be finite numbers'
      );

      expect(() => calculateJenks([1, 2, -Infinity, 4], 3)).toThrow(
        'All values must be finite numbers'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty array', () => {
      const breaks = calculateJenks([], 5);
      expect(breaks).toEqual([]);
    });

    it('should handle single value', () => {
      const breaks = calculateJenks([42], 5);
      expect(breaks).toHaveLength(2);
      expect(breaks[0]).toBe(42);
      expect(breaks[1]).toBe(42);
    });

    it('should handle all identical values', () => {
      const breaks = calculateJenks([5, 5, 5, 5, 5], 3);
      expect(breaks).toEqual([5, 5, 5, 5]);
    });

    it('should handle numClasses >= data points', () => {
      const values = [1, 2, 3, 4];
      const breaks = calculateJenks(values, 5);
      expect(breaks).toEqual([1, 2, 3, 4]);
    });

    it('should handle numClasses equal to unique values - 1', () => {
      const values = [1, 2, 3, 4, 5];
      const breaks = calculateJenks(values, 4);
      expect(breaks).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('basic functionality', () => {
    it('should return correct number of breaks', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const breaks = calculateJenks(values, 3);
      expect(breaks).toHaveLength(4); // numClasses + 1
    });

    it('should return breaks in ascending order', () => {
      const values = [10, 2, 8, 3, 7, 1, 9, 4, 6, 5];
      const breaks = calculateJenks(values, 4);

      for (let i = 1; i < breaks.length; i++) {
        expect(breaks[i]).toBeGreaterThanOrEqual(breaks[i - 1]!);
      }
    });

    it('should include min and max values', () => {
      const values = [5, 10, 15, 20, 25, 30, 35, 40];
      const breaks = calculateJenks(values, 3);

      expect(breaks[0]).toBe(5); // min
      expect(breaks[breaks.length - 1]!).toBe(40); // max
    });

    it('should handle unsorted input', () => {
      const values = [50, 10, 30, 20, 40];
      const breaks = calculateJenks(values, 2);

      expect(breaks[0]).toBe(10); // min
      expect(breaks[breaks.length - 1]!).toBe(50); // max
      expect(breaks).toHaveLength(3);
    });

    it('should handle negative values', () => {
      const values = [-10, -5, 0, 5, 10];
      const breaks = calculateJenks(values, 2);

      expect(breaks[0]).toBe(-10);
      expect(breaks[breaks.length - 1]!).toBe(10);
      expect(breaks).toHaveLength(3);
    });

    it('should handle floating point values', () => {
      const values = [1.1, 2.2, 3.3, 4.4, 5.5];
      const breaks = calculateJenks(values, 2);

      expect(breaks[0]).toBe(1.1);
      expect(breaks[breaks.length - 1]!).toBe(5.5);
      expect(breaks).toHaveLength(3);
    });
  });

  describe('algorithm correctness', () => {
    it('should create natural breaks for bimodal distribution', () => {
      // Two clear clusters: [1-5] and [20-25]
      const values = [1, 2, 3, 4, 5, 20, 21, 22, 23, 24, 25];
      const breaks = calculateJenks(values, 2);

      expect(breaks).toHaveLength(3);
      expect(breaks[0]).toBe(1); // min
      expect(breaks[2]).toBe(25); // max

      // Break should be at or after 5 and before 20 to separate clusters
      expect(breaks[1]).toBeGreaterThanOrEqual(5);
      expect(breaks[1]).toBeLessThan(20);
    });

    it('should minimize within-class variance for three clusters', () => {
      // Three distinct clusters
      const values = [1, 2, 3, 10, 11, 12, 20, 21, 22];
      const breaks = calculateJenks(values, 3);

      expect(breaks).toHaveLength(4);
      expect(breaks[0]).toBe(1);
      expect(breaks[3]).toBe(22);

      // First break should separate first and second cluster
      expect(breaks[1]).toBeGreaterThanOrEqual(3);
      expect(breaks[1]).toBeLessThan(10);

      // Second break should separate second and third cluster
      expect(breaks[2]).toBeGreaterThanOrEqual(12);
      expect(breaks[2]).toBeLessThan(20);
    });

    it('should handle evenly distributed data', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const breaks = calculateJenks(values, 2);

      expect(breaks).toHaveLength(3);
      expect(breaks[0]).toBe(1);
      expect(breaks[2]).toBe(10);

      // For evenly distributed data, break should be near middle
      expect(breaks[1]).toBeGreaterThanOrEqual(4);
      expect(breaks[1]).toBeLessThanOrEqual(7);
    });

    it('should identify optimal breaks for skewed distribution', () => {
      // Heavily right-skewed: many low values, few high values
      const values = [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10, // 10 low values
        50,
        100, // 2 high values
      ];
      const breaks = calculateJenks(values, 3);

      expect(breaks).toHaveLength(4);
      expect(breaks[0]).toBe(1);
      expect(breaks[3]).toBe(100);

      // Should create smaller classes for the clustered low values
      // and separate the high outliers
      expect(breaks[2]).toBeGreaterThan(10);
    });
  });

  describe('realistic data scenarios', () => {
    it('should handle typical bike-sharing station data', () => {
      // Simulate power-law distribution (typical for trip counts)
      const lowActivity = Array(100)
        .fill(0)
        .map(() => Math.random() * 50); // 0-50 trips

      const mediumActivity = Array(30)
        .fill(0)
        .map(() => 50 + Math.random() * 100); // 50-150 trips

      const highActivity = Array(10)
        .fill(0)
        .map(() => 150 + Math.random() * 200); // 150-350 trips

      const values = [...lowActivity, ...mediumActivity, ...highActivity];
      const breaks = calculateJenks(values, 7);

      expect(breaks).toHaveLength(8);
      expect(breaks[0]!).toBeLessThan(breaks[breaks.length - 1]!);

      // Verify all breaks are finite numbers
      breaks.forEach((b) => {
        expect(Number.isFinite(b)).toBe(true);
      });

      // Verify breaks are strictly ascending
      for (let i = 1; i < breaks.length; i++) {
        expect(breaks[i]).toBeGreaterThanOrEqual(breaks[i - 1]!);
      }
    });

    it('should handle zero values', () => {
      const values = [0, 0, 0, 1, 2, 3, 10, 20, 30];
      const breaks = calculateJenks(values, 3);

      expect(breaks).toHaveLength(4);
      expect(breaks[0]).toBe(0);
      expect(breaks[breaks.length - 1]!).toBe(30);
    });

    it('should handle large datasets efficiently', () => {
      // Generate 500 random values
      const values = Array(500)
        .fill(0)
        .map(() => Math.random() * 1000);

      const startTime = performance.now();
      const breaks = calculateJenks(values, 7);
      const endTime = performance.now();

      expect(breaks).toHaveLength(8);
      expect(breaks[0]!).toBeLessThanOrEqual(breaks[breaks.length - 1]!);

      // Should complete in reasonable time (< 500ms for 500 values)
      const executionTime = endTime - startTime;
      console.log(`Execution time for 500 values: ${executionTime.toFixed(2)}ms`);
      expect(executionTime).toBeLessThan(500);
    });

    it('should produce consistent results', () => {
      const values = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
      const breaks1 = calculateJenks(values, 3);
      const breaks2 = calculateJenks(values, 3);

      // Should produce identical results for same input
      expect(breaks1).toEqual(breaks2);
    });

    it('should handle duplicate values', () => {
      const values = [1, 1, 2, 2, 3, 3, 10, 10, 20, 20];
      const breaks = calculateJenks(values, 3);

      expect(breaks).toHaveLength(4);
      expect(breaks[0]).toBe(1);
      expect(breaks[breaks.length - 1]!).toBe(20);
    });
  });

  describe('class distribution', () => {
    it('should create classes that contain data points', () => {
      const values = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
      const breaks = calculateJenks(values, 4);

      // Count how many values fall into each class
      const classCounts = Array(breaks.length - 1).fill(0);

      values.forEach((v) => {
        for (let i = 0; i < breaks.length - 1; i++) {
          if (v >= breaks[i]! && v < breaks[i + 1]!) {
            (classCounts[i] as number)++;
            break;
          } else if (i === breaks.length - 2 && v === breaks[i + 1]) {
            // Handle max value edge case
            (classCounts[i] as number)++;
            break;
          }
        }
      });

      // Each class should contain at least one value
      classCounts.forEach((count) => {
        expect(count).toBeGreaterThan(0);
      });

      // Total should equal number of input values
      const total = classCounts.reduce((sum, count) => sum + count, 0);
      expect(total).toBe(values.length);
    });
  });

  describe('known test cases', () => {
    it('should match expected breaks for simple example', () => {
      // Example from literature
      const values = [1, 2, 4, 5, 7, 9, 10, 20];
      const breaks = calculateJenks(values, 3);

      expect(breaks).toHaveLength(4);
      expect(breaks[0]).toBe(1);
      expect(breaks[3]).toBe(20);

      // With 3 classes, should roughly separate into:
      // [1,2,4,5], [7,9,10], [20]
      // or similar natural groupings
      expect(breaks[1]).toBeGreaterThanOrEqual(5);
      expect(breaks[1]).toBeLessThanOrEqual(7);
      expect(breaks[2]).toBeGreaterThanOrEqual(10);
      expect(breaks[2]).toBeLessThanOrEqual(20);
    });
  });
});
