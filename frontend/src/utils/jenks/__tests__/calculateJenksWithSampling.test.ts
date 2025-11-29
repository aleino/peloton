import { describe, it, expect } from 'vitest';
import {
  calculateJenksWithSampling,
  stratifiedSample,
  randomSample,
  adaptiveSample,
} from '../calculateJenksWithSampling';
import { calculateJenks } from '../calculateJenks';

describe('calculateJenksWithSampling', () => {
  describe('sampling behavior', () => {
    it('should use full Jenks for small datasets', () => {
      const values = Array.from({ length: 50 }, (_unused, i) => i);
      const breaks = calculateJenksWithSampling(values, 5, { sampleSize: 100 });

      // Should use full algorithm
      expect(breaks).toHaveLength(6);
    });

    it('should sample large datasets', () => {
      const values = Array.from({ length: 500 }, (_unused, i) => i);
      const breaks = calculateJenksWithSampling(values, 7, { sampleSize: 100 });

      // Should still produce valid breaks
      expect(breaks).toHaveLength(8);
      expect(breaks[0]).toBe(0);
      expect(breaks[7]).toBe(499);
    });

    it('should respect forceFull option', () => {
      const values = Array.from({ length: 500 }, (_unused, i) => i);

      // With forceFull, should use all values
      const breaks = calculateJenksWithSampling(values, 5, {
        sampleSize: 100,
        forceFull: true,
      });

      expect(breaks).toHaveLength(6);
    });

    it('should handle empty arrays', () => {
      const breaks = calculateJenksWithSampling([], 5);
      expect(breaks).toEqual([]);
    });

    it('should filter out non-finite values', () => {
      const values = [1, 2, NaN, 4, Infinity, 6, -Infinity, 8, 9, 10];
      const breaks = calculateJenksWithSampling(values, 3);

      // Should only use finite values: [1, 2, 4, 6, 8, 9, 10]
      expect(breaks).toHaveLength(4);
    });

    it('should return empty array for all non-finite values', () => {
      const values = [NaN, Infinity, -Infinity];
      const breaks = calculateJenksWithSampling(values, 3);
      expect(breaks).toEqual([]);
    });
  });

  describe('stratification strategies', () => {
    const largeDataset = Array.from({ length: 500 }, (_unused, i) => i);

    it('should use quantile stratification by default', () => {
      const breaks = calculateJenksWithSampling(largeDataset, 7);

      expect(breaks).toHaveLength(8);
      expect(breaks[0]).toBe(0);
      expect(breaks[7]).toBe(499);
    });

    it('should support random sampling', () => {
      const breaks = calculateJenksWithSampling(largeDataset, 7, {
        stratification: 'random',
      });

      expect(breaks).toHaveLength(8);
    });

    it('should support adaptive sampling', () => {
      // Create data with variable variance
      const values = [
        ...Array(200)
          .fill(0)
          .map(() => Math.random() * 10), // Low variance
        ...Array(200)
          .fill(0)
          .map(() => 50 + Math.random() * 100), // High variance
      ];

      const breaks = calculateJenksWithSampling(values, 7, {
        stratification: 'adaptive',
        sampleSize: 100,
      });

      expect(breaks).toHaveLength(8);
    });
  });

  describe('quality comparison', () => {
    it('should produce similar breaks to full Jenks', () => {
      // Realistic bike-sharing data simulation
      const values = [
        ...Array(300)
          .fill(0)
          .map(() => Math.random() * 50),
        ...Array(100)
          .fill(0)
          .map(() => 50 + Math.random() * 100),
        ...Array(50)
          .fill(0)
          .map(() => 150 + Math.random() * 200),
      ];

      const fullBreaks = calculateJenks(values, 7);
      const sampledBreaks = calculateJenksWithSampling(values, 7, { sampleSize: 100 });

      // Breaks should be reasonably close (within 20%)
      for (let i = 0; i < fullBreaks.length; i++) {
        const diff = Math.abs(fullBreaks[i]! - sampledBreaks[i]!);
        const relativeDiff = diff / Math.max(fullBreaks[i]!, 1);

        // Allow up to 20% difference (relaxed for visualization purposes with random data)
        expect(relativeDiff).toBeLessThan(0.2);
      }
    });

    it('should handle identical breaks at boundaries', () => {
      const values = Array.from({ length: 500 }, (_unused, i) => i);
      const breaks = calculateJenksWithSampling(values, 7);

      // First and last breaks should match the full dataset
      expect(breaks[0]).toBe(0);
      expect(breaks[breaks.length - 1]).toBe(499);
    });
  });

  describe('edge cases', () => {
    it('should handle dataset equal to sample size', () => {
      const values = Array.from({ length: 100 }, (_unused, i) => i);
      const breaks = calculateJenksWithSampling(values, 5, { sampleSize: 100 });

      expect(breaks).toHaveLength(6);
      expect(breaks[0]).toBe(0);
      expect(breaks[5]).toBe(99);
    });

    it('should handle dataset smaller than sample size', () => {
      const values = Array.from({ length: 50 }, (_unused, i) => i);
      const breaks = calculateJenksWithSampling(values, 5, { sampleSize: 100 });

      expect(breaks).toHaveLength(6);
    });

    it('should handle single value', () => {
      const breaks = calculateJenksWithSampling([42], 5);
      expect(breaks).toHaveLength(2);
      expect(breaks[0]).toBe(42);
      expect(breaks[1]).toBe(42);
    });

    it('should handle all identical values', () => {
      const values = Array(500).fill(5);
      const breaks = calculateJenksWithSampling(values, 3);

      expect(breaks).toEqual([5, 5, 5, 5]);
    });
  });

  describe('custom options', () => {
    it('should respect custom sample size', () => {
      const values = Array.from({ length: 500 }, (_unused, i) => i);
      const breaks = calculateJenksWithSampling(values, 5, { sampleSize: 150 });

      expect(breaks).toHaveLength(6);
      expect(breaks[0]).toBe(0);
      expect(breaks[5]).toBe(499);
    });

    it('should handle default parameters', () => {
      const values = Array.from({ length: 200 }, (_unused, i) => i);
      const breaks = calculateJenksWithSampling(values);

      // Default numClasses = 7
      expect(breaks).toHaveLength(8);
    });
  });
});

describe('sampling helper functions', () => {
  describe('stratifiedSample', () => {
    it('should distribute samples evenly across range', () => {
      const sorted = Array.from({ length: 100 }, (_unused, i) => i);
      const sample = stratifiedSample(sorted, 10);

      expect(sample).toHaveLength(10);
      expect(sample[0]).toBe(0);
      expect(sample[9]).toBe(99); // Last value should be included

      // Should be roughly evenly spaced
      for (let i = 1; i < sample.length; i++) {
        const spacing = sample[i]! - sample[i - 1]!;
        expect(spacing).toBeGreaterThanOrEqual(8);
        expect(spacing).toBeLessThanOrEqual(13);
      }
    });

    it('should handle small arrays', () => {
      const sorted = [1, 2, 3, 4, 5];
      const sample = stratifiedSample(sorted, 3);

      expect(sample).toHaveLength(3);
      expect(sample[0]).toBe(1);
      expect(sample[2]).toBe(5);
    });

    it('should handle target size equal to array length', () => {
      const sorted = [1, 2, 3, 4, 5];
      const sample = stratifiedSample(sorted, 5);

      expect(sample).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle target size larger than array length', () => {
      const sorted = [1, 2, 3];
      const sample = stratifiedSample(sorted, 10);

      expect(sample).toHaveLength(10);
      // Will have duplicates at the end
      expect(sample[sample.length - 1]).toBe(3);
    });

    it('should include first and last values', () => {
      const sorted = Array.from({ length: 1000 }, (_unused, i) => i);
      const sample = stratifiedSample(sorted, 50);

      expect(sample[0]).toBe(0);
      expect(sample[sample.length - 1]).toBe(999);
    });
  });

  describe('randomSample', () => {
    it('should return correct number of samples', () => {
      const sorted = Array.from({ length: 100 }, (_unused, i) => i);
      const sample = randomSample(sorted, 20);

      expect(sample).toHaveLength(20);
    });

    it('should return sorted samples', () => {
      const sorted = Array.from({ length: 100 }, (_unused, i) => i);
      const sample = randomSample(sorted, 20);

      for (let i = 1; i < sample.length; i++) {
        expect(sample[i]).toBeGreaterThanOrEqual(sample[i - 1]!);
      }
    });

    it('should sample from full range', () => {
      const sorted = Array.from({ length: 100 }, (_unused, i) => i);
      const sample = randomSample(sorted, 50);

      // Should have values from beginning and end
      expect(Math.min(...sample)).toBeLessThan(20);
      expect(Math.max(...sample)).toBeGreaterThan(80);
    });

    it('should handle small arrays', () => {
      const sorted = [1, 2, 3];
      const sample = randomSample(sorted, 2);

      expect(sample).toHaveLength(2);
      sample.forEach((v) => {
        expect(sorted).toContain(v);
      });
    });
  });

  describe('adaptiveSample', () => {
    it('should allocate more samples to high-variance regions', () => {
      // Create data with clear variance difference
      const lowVariance = Array(50).fill(100);
      const highVariance = Array.from({ length: 50 }, (_unused, i) => i * 10);
      const sorted = [...lowVariance, ...highVariance].sort((a, b) => a - b);

      const sample = adaptiveSample(sorted, 50);

      expect(sample).toHaveLength(50);

      // Count samples from each region
      const samplesFromLowVar = sample.filter((v) => v === 100).length;
      const samplesFromHighVar = sample.filter((v) => v !== 100).length;

      // High variance region should have more samples
      expect(samplesFromHighVar).toBeGreaterThan(samplesFromLowVar);
    });

    it('should handle uniform data gracefully', () => {
      const sorted = Array.from({ length: 100 }, (_unused, i) => i);
      const sample = adaptiveSample(sorted, 20);

      expect(sample).toHaveLength(20);
      // Should fall back to stratified-like behavior
      expect(sample[0]).toBeLessThan(10);
      expect(sample[sample.length - 1]).toBeGreaterThan(90);
    });

    it('should handle all identical values', () => {
      const sorted = Array(100).fill(42);
      const sample = adaptiveSample(sorted, 20);

      expect(sample).toHaveLength(20);
      expect(sample.every((v) => v === 42)).toBe(true);
    });

    it('should respect target size', () => {
      const sorted = Array.from({ length: 500 }, () => Math.random() * 100);
      const sample = adaptiveSample(
        sorted.sort((a, b) => a - b),
        100
      );

      expect(sample.length).toBeLessThanOrEqual(100);
      expect(sample.length).toBeGreaterThan(90); // Allow some tolerance
    });

    it('should handle small datasets', () => {
      const sorted = [1, 2, 3, 4, 5];
      const sample = adaptiveSample(sorted, 3);

      expect(sample).toHaveLength(3);
    });

    it('should maintain sorted order', () => {
      const sorted = Array.from({ length: 200 }, () => Math.random() * 100).sort((a, b) => a - b);
      const sample = adaptiveSample(sorted, 50);

      for (let i = 1; i < sample.length; i++) {
        expect(sample[i]).toBeGreaterThanOrEqual(sample[i - 1]!);
      }
    });
  });
});

describe('sampling performance', () => {
  it('should be significantly faster for large datasets', () => {
    const largeDataset = Array.from({ length: 1000 }, () => Math.random() * 1000);

    const fullStart = performance.now();
    calculateJenks(largeDataset, 7);
    const fullTime = performance.now() - fullStart;

    const sampledStart = performance.now();
    calculateJenksWithSampling(largeDataset, 7, { sampleSize: 100 });
    const sampledTime = performance.now() - sampledStart;

    console.log(`Full Jenks time: ${fullTime.toFixed(2)}ms`);
    console.log(`Sampled Jenks time: ${sampledTime.toFixed(2)}ms`);
    console.log(`Speedup: ${(fullTime / sampledTime).toFixed(1)}x`);

    // Should be at least 5x faster (conservative check)
    expect(sampledTime * 5).toBeLessThan(fullTime);
  });

  it('should handle very large datasets efficiently', () => {
    const veryLargeDataset = Array.from({ length: 2000 }, () => Math.random() * 1000);

    const start = performance.now();
    const breaks = calculateJenksWithSampling(veryLargeDataset, 7, { sampleSize: 100 });
    const time = performance.now() - start;

    console.log(`Time for 2000 values with sampling: ${time.toFixed(2)}ms`);

    // Should complete in reasonable time (< 50ms for sampled version)
    expect(time).toBeLessThan(50);
    expect(breaks).toHaveLength(8);
  });

  it('should show minimal overhead for small datasets', () => {
    const smallDataset = Array.from({ length: 50 }, () => Math.random() * 100);

    const directStart = performance.now();
    const directBreaks = calculateJenks(smallDataset, 7);
    const directTime = performance.now() - directStart;

    const sampledStart = performance.now();
    const sampledBreaks = calculateJenksWithSampling(smallDataset, 7, { sampleSize: 100 });
    const sampledTime = performance.now() - sampledStart;

    console.log(`Direct time (small dataset): ${directTime.toFixed(2)}ms`);
    console.log(`Sampled wrapper time (small dataset): ${sampledTime.toFixed(2)}ms`);

    // Should have minimal overhead (< 2x since it delegates to full Jenks)
    expect(sampledTime).toBeLessThan(directTime * 2);

    // Should produce identical results
    expect(sampledBreaks).toEqual(directBreaks);
  });
});
