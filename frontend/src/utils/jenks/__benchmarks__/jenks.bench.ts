import { bench, describe } from 'vitest';
import {
  calculateJenks,
  calculateJenksWithSampling,
  calculateJenksBreaks,
  clearJenksCache,
} from '../index';

/**
 * Generate test data matching different distribution types
 *
 * This function creates synthetic datasets that mirror real-world
 * bike-sharing data distributions for realistic benchmarking.
 */
function generateTestData(
  size: number,
  distribution: 'uniform' | 'power-law' | 'bimodal'
): number[] {
  switch (distribution) {
    case 'uniform':
      // Evenly distributed values (rare in real data)
      return Array.from({ length: size }, (_, i) => i);

    case 'power-law':
      // Heavy-tailed distribution (typical for bike-sharing trip counts)
      // Most stations have low values, few have very high values
      // This mirrors actual HSL data where 70% of stations have <50 trips
      // but some busy stations have 200+ trips
      return Array.from({ length: size }, () => {
        const u = Math.random();
        // Power-law: P(X) ~ X^(-α), α = 2 for typical distribution
        return Math.floor(Math.pow(u, -0.5) * 100);
      });

    case 'bimodal':
      // Two distinct clusters (e.g., city center vs suburbs)
      // 70% low-activity stations, 30% high-activity stations
      return [
        ...Array(Math.floor(size * 0.7))
          .fill(0)
          .map(() => Math.random() * 50),
        ...Array(Math.floor(size * 0.3))
          .fill(0)
          .map(() => 150 + Math.random() * 100),
      ];

    default:
      return Array.from({ length: size }, () => Math.random() * 1000);
  }
}

/**
 * Benchmark Suite: Jenks Natural Breaks Optimization Performance
 *
 * This suite measures the performance of various Jenks optimization strategies
 * across different scenarios to validate our optimization targets:
 *
 * - Full Jenks (450 pts, 7 classes): Target < 200ms
 * - Sampled Jenks (100 pts): Target < 20ms
 * - Cache hit: Target < 1ms
 * - Speedup: Target > 8x
 */

describe('Jenks Performance Benchmarks', () => {
  /**
   * Benchmark 1: Core algorithm across different dataset sizes
   *
   * This establishes the baseline performance characteristics
   * and validates the O(n²k) complexity behavior.
   */
  describe('Core Jenks Algorithm', () => {
    const sizes = [50, 100, 250, 450, 1000, 2000];
    const numClasses = 7;

    for (const size of sizes) {
      const data = generateTestData(size, 'power-law');

      bench(`calculateJenks - ${size} points, ${numClasses} classes`, () => {
        calculateJenks(data, numClasses);
      });
    }
  });

  /**
   * Benchmark 1b: Extended dataset sizes with more clusters
   *
   * Tests performance with larger datasets and more classes
   * to validate scalability for future growth.
   */
  describe('Extended Dataset Sizes', () => {
    const sizes = [1000, 2000];
    const classOptions = [7, 11];

    for (const size of sizes) {
      for (const numClasses of classOptions) {
        const data = generateTestData(size, 'power-law');

        bench(`Full Jenks - ${size} points, ${numClasses} classes`, () => {
          calculateJenks(data, numClasses);
        });

        bench(`Sampled Jenks - ${size} points, ${numClasses} classes`, () => {
          calculateJenksWithSampling(data, numClasses, {
            sampleSize: Math.min(150, Math.floor(size * 0.2)),
          });
        });

        bench(`Cached Jenks - ${size} points, ${numClasses} classes`, () => {
          calculateJenksBreaks(data, numClasses);
        });
      }
    }
  });

  /**
   * Benchmark 2: Sampling strategies comparison
   *
   * This compares different sampling approaches to identify
   * the fastest while maintaining accuracy.
   */
  describe('Sampling Strategies', () => {
    const data = generateTestData(450, 'power-law');
    const numClasses = 7;

    bench('Full Jenks (no sampling)', () => {
      calculateJenks(data, numClasses);
    });

    bench('Stratified sampling (quantile, 100 points)', () => {
      calculateJenksWithSampling(data, numClasses, {
        sampleSize: 100,
        stratification: 'quantile',
      });
    });

    bench('Stratified sampling (quantile, 150 points)', () => {
      calculateJenksWithSampling(data, numClasses, {
        sampleSize: 150,
        stratification: 'quantile',
      });
    });

    bench('Random sampling (100 points)', () => {
      calculateJenksWithSampling(data, numClasses, {
        sampleSize: 100,
        stratification: 'random',
      });
    });

    bench('Adaptive sampling (100 points)', () => {
      calculateJenksWithSampling(data, numClasses, {
        sampleSize: 100,
        stratification: 'adaptive',
      });
    });
  });

  /**
   * Benchmark 3: Number of classes comparison
   *
   * This measures how the number of classes affects performance.
   */
  describe('Different Number of Classes', () => {
    const data = generateTestData(450, 'power-law');
    const classOptions = [5, 7, 9, 11];

    for (const numClasses of classOptions) {
      bench(`Full Jenks - ${numClasses} classes`, () => {
        calculateJenks(data, numClasses);
      });

      bench(`Sampled Jenks - ${numClasses} classes`, () => {
        calculateJenksWithSampling(data, numClasses, { sampleSize: 100 });
      });
    }
  });

  /**
   * Benchmark 4: Cache performance
   *
   * This measures the effectiveness of the caching strategy.
   * Critical for validating our <1ms target for cache hits.
   */
  describe('Cache Performance', () => {
    const data = generateTestData(450, 'power-law');
    const numClasses = 7;

    bench(
      'First calculation (cache miss)',
      () => {
        clearJenksCache();
        calculateJenksBreaks(data, numClasses);
      },
      {
        setup() {
          clearJenksCache();
        },
      }
    );

    bench(
      'Subsequent calculation (cache hit)',
      () => {
        // Cache is warmed up from previous iterations
        calculateJenksBreaks(data, numClasses);
      },
      {
        setup() {
          clearJenksCache();
          // Warm up cache
          calculateJenksBreaks(data, numClasses);
        },
      }
    );
  });

  /**
   * Benchmark 5: Different data distributions
   *
   * This validates performance across different data patterns
   * to ensure consistent behavior.
   */
  describe('Different Data Distributions', () => {
    const size = 450;
    const numClasses = 7;

    const distributions = ['uniform', 'power-law', 'bimodal'] as const;

    for (const dist of distributions) {
      const data = generateTestData(size, dist);

      bench(`Full Jenks - ${dist} distribution`, () => {
        calculateJenks(data, numClasses);
      });

      bench(`Sampled Jenks - ${dist} distribution`, () => {
        calculateJenksWithSampling(data, numClasses, { sampleSize: 100 });
      });
    }
  });

  /**
   * Benchmark 6: Realistic usage pattern
   *
   * This simulates typical user interactions with the map filters
   * to measure real-world performance.
   */
  describe('Realistic Usage Scenarios', () => {
    // Simulate typical filter interactions
    const allStations = Array.from({ length: 450 }, () => Math.random() * 1000);
    const highActivity = allStations.filter((v) => v > 500);
    const lowActivity = allStations.filter((v) => v < 200);

    bench('Filter interaction sequence (with cache)', () => {
      // Simulate user toggling between filters
      calculateJenksBreaks(allStations, 7);
      calculateJenksBreaks(highActivity, 7);
      calculateJenksBreaks(allStations, 7); // Cache hit
      calculateJenksBreaks(lowActivity, 7);
      calculateJenksBreaks(highActivity, 7); // Cache hit
    });

    bench('Filter interaction sequence (no cache)', () => {
      clearJenksCache();
      calculateJenks(allStations, 7);
      clearJenksCache();
      calculateJenks(highActivity, 7);
      clearJenksCache();
      calculateJenks(allStations, 7);
      clearJenksCache();
      calculateJenks(lowActivity, 7);
      clearJenksCache();
      calculateJenks(highActivity, 7);
    });
  });

  /**
   * Benchmark 7: Optimization speedup factors
   *
   * This measures the combined effectiveness of all optimizations
   * to validate our 10-20x speedup target.
   */
  describe('Optimization Speedup', () => {
    const data = generateTestData(450, 'power-law');
    const numClasses = 7;

    // Baseline: full calculation
    bench('Baseline: Full Jenks (no optimizations)', () => {
      calculateJenks(data, numClasses);
    });

    // Optimization 1: Sampling only
    bench('Optimization: Sampling (no cache)', () => {
      clearJenksCache();
      calculateJenksWithSampling(data, numClasses, { sampleSize: 100 });
    });

    // Optimization 2: Caching (after warm-up)
    bench(
      'Optimization: Cache hit',
      () => {
        calculateJenksBreaks(data, numClasses);
      },
      {
        setup() {
          clearJenksCache();
          calculateJenksBreaks(data, numClasses); // Warm up
        },
      }
    );
  });

  /**
   * Benchmark 8: Mobile-relevant scenarios
   *
   * This tests performance with smaller datasets typical
   * of filtered map views on mobile devices.
   */
  describe('Mobile Performance', () => {
    // Smaller datasets typical of filtered views
    const sizes = [100, 200, 300];
    const numClasses = 7;

    for (const size of sizes) {
      const data = generateTestData(size, 'power-law');

      bench(`Mobile scenario - ${size} stations`, () => {
        calculateJenksBreaks(data, numClasses);
      });
    }
  });

  /**
   * Benchmark 9: Edge cases and stress tests
   *
   * This validates performance with unusual data patterns.
   */
  describe('Edge Cases', () => {
    const numClasses = 7;

    // Very small datasets
    bench('Tiny dataset - 10 points', () => {
      const data = generateTestData(10, 'uniform');
      calculateJenksBreaks(data, numClasses);
    });

    // All identical values
    bench('Identical values - 450 points', () => {
      const data = Array(450).fill(100);
      calculateJenksBreaks(data, numClasses);
    });

    // Highly skewed distribution (one extreme outlier)
    bench('Extreme outlier - 450 points', () => {
      const data = [...Array(449).fill(10), 10000];
      calculateJenksBreaks(data, numClasses);
    });

    // Many unique values (worst case for cache)
    bench('High uniqueness - 450 unique values', () => {
      const data = Array.from({ length: 450 }, (_, i) => i);
      clearJenksCache();
      calculateJenksBreaks(data, numClasses);
    });
  });

  /**
   * Benchmark 10: Cache eviction performance
   *
   * This measures the impact of cache eviction on performance.
   */
  describe('Cache Eviction Scenarios', () => {
    const numClasses = 7;

    bench('Cache thrashing - 60 different datasets', () => {
      // Generate 60 datasets to force cache eviction (limit is 50)
      clearJenksCache();
      for (let i = 0; i < 60; i++) {
        const data = generateTestData(100 + i, 'power-law');
        calculateJenksBreaks(data, numClasses);
      }
    });

    bench('Cache reuse - 10 datasets cycled 6 times', () => {
      // Reuse datasets to maximize cache hits
      clearJenksCache();
      const datasets = Array.from({ length: 10 }, (_, i) =>
        generateTestData(100 + i * 10, 'power-law')
      );

      for (let cycle = 0; cycle < 6; cycle++) {
        for (const data of datasets) {
          calculateJenksBreaks(data, numClasses);
        }
      }
    });
  });
});
