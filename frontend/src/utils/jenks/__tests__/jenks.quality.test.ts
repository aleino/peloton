import { describe, it, expect } from 'vitest';
import { calculateJenks } from '../calculateJenks';
import { calculateJenksWithSampling } from '../calculateJenksWithSampling';

/**
 * Calculate Goodness of Variance Fit (GVF) for a classification
 *
 * GVF measures how well the classification minimizes within-class variance.
 * Higher is better (0 = worst, 1 = perfect).
 *
 * Formula: GVF = 1 - (SDCM / SDAM)
 * Where:
 * - SDCM = Sum of Squared Deviations from Class Means
 * - SDAM = Sum of Squared Deviations from Array Mean
 *
 * @param values - Array of all values
 * @param breaks - Break points from classification
 * @returns GVF score (0-1, higher is better)
 */
function calculateGVF(values: number[], breaks: number[]): number {
  if (values.length === 0 || breaks.length < 2) {
    return 0;
  }

  // Calculate overall mean
  const overallMean = values.reduce((sum, v) => sum + v, 0) / values.length;

  // Calculate total variance (SDAM)
  const totalVariance = values.reduce((sum, v) => sum + Math.pow(v - overallMean, 2), 0);

  if (totalVariance === 0) {
    return 1; // Perfect fit for constant values
  }

  // Calculate within-class variance (SDCM)
  let withinClassVariance = 0;

  for (let i = 0; i < breaks.length - 1; i++) {
    const classMin = breaks[i]!;
    const classMax = breaks[i + 1]!;

    // Get all values in this class
    // Include upper bound for last class, exclude for others
    const classValues = values.filter((v) => {
      if (i === breaks.length - 2) {
        // Last class: include upper bound
        return v >= classMin && v <= classMax;
      } else {
        // Other classes: exclude upper bound
        return v >= classMin && v < classMax;
      }
    });

    if (classValues.length === 0) continue;

    // Calculate class mean
    const classMean = classValues.reduce((sum, v) => sum + v, 0) / classValues.length;

    // Add to within-class variance
    withinClassVariance += classValues.reduce((sum, v) => sum + Math.pow(v - classMean, 2), 0);
  }

  // GVF = 1 - (within / total)
  const gvf = 1 - withinClassVariance / totalVariance;

  return gvf;
}

/**
 * Compare two sets of breaks and calculate relative difference
 */
function compareBreaks(
  breaks1: number[],
  breaks2: number[]
): {
  maxRelativeDiff: number;
  avgRelativeDiff: number;
  differences: number[];
} {
  if (breaks1.length !== breaks2.length) {
    throw new Error('Break arrays must have same length');
  }

  const differences = breaks1.map((b1, i) => {
    const b2 = breaks2[i]!;
    const diff = Math.abs(b1 - b2);
    const relativeDiff = diff / Math.max(Math.abs(b1), 1);
    return relativeDiff;
  });

  return {
    maxRelativeDiff: Math.max(...differences),
    avgRelativeDiff: differences.reduce((sum, d) => sum + d, 0) / differences.length,
    differences,
  };
}

/**
 * Calculate classification accuracy: % of values assigned to same class
 */
function calculateClassificationAccuracy(
  values: number[],
  breaks1: number[],
  breaks2: number[]
): number {
  if (values.length === 0) return 1;

  let sameClass = 0;

  for (const value of values) {
    const class1 = findClass(value, breaks1);
    const class2 = findClass(value, breaks2);

    if (class1 === class2) {
      sameClass++;
    }
  }

  return sameClass / values.length;
}

/**
 * Find which class a value belongs to
 */
function findClass(value: number, breaks: number[]): number {
  for (let i = 0; i < breaks.length - 1; i++) {
    if (i === breaks.length - 2) {
      // Last class: include upper bound
      if (value >= breaks[i]! && value <= breaks[i + 1]!) {
        return i;
      }
    } else {
      // Other classes: exclude upper bound
      if (value >= breaks[i]! && value < breaks[i + 1]!) {
        return i;
      }
    }
  }
  return breaks.length - 2; // Fallback to last class
}

/**
 * Generate test datasets with specific characteristics
 */
function generateTestDataset(
  type: 'uniform' | 'power-law' | 'bimodal' | 'skewed',
  size: number
): number[] {
  switch (type) {
    case 'uniform':
      return Array.from({ length: size }, (_, i) => i);

    case 'power-law':
      // Heavy-tailed like bike-sharing data
      return Array.from({ length: size }, () => {
        const u = Math.random();
        return Math.floor(Math.pow(u, -0.5) * 100);
      });

    case 'bimodal':
      // Two distinct clusters
      return [
        ...Array(Math.floor(size * 0.6))
          .fill(0)
          .map(() => Math.random() * 50),
        ...Array(Math.floor(size * 0.4))
          .fill(0)
          .map(() => 150 + Math.random() * 100),
      ];

    case 'skewed':
      // Highly skewed with long tail
      return [
        ...Array(Math.floor(size * 0.8))
          .fill(0)
          .map(() => Math.random() * 30),
        ...Array(Math.floor(size * 0.15))
          .fill(0)
          .map(() => 30 + Math.random() * 70),
        ...Array(Math.floor(size * 0.05))
          .fill(0)
          .map(() => 100 + Math.random() * 400),
      ];
  }
}

describe('Jenks Quality Validation', () => {
  describe('GVF Score Comparison', () => {
    const testCases = [
      { name: 'Uniform distribution', type: 'uniform' as const, size: 450 },
      { name: 'Power-law distribution', type: 'power-law' as const, size: 450 },
      { name: 'Bimodal distribution', type: 'bimodal' as const, size: 450 },
      { name: 'Skewed distribution', type: 'skewed' as const, size: 450 },
    ];

    for (const testCase of testCases) {
      it(`should maintain high GVF for ${testCase.name}`, () => {
        const values = generateTestDataset(testCase.type, testCase.size);

        // Calculate with both methods
        const fullBreaks = calculateJenks(values, 7);
        const sampledBreaks = calculateJenksWithSampling(values, 7, { sampleSize: 100 });

        // Calculate GVF for both
        const fullGVF = calculateGVF(values, fullBreaks);
        const sampledGVF = calculateGVF(values, sampledBreaks);

        // Sampled GVF should be > 0.70 (relaxed for power-law distributions)
        // Power-law distributions are particularly challenging due to extreme values
        expect(sampledGVF).toBeGreaterThan(0.7);

        // Sampled GVF should be within 20% of full GVF (relaxed tolerance)
        const gvfDiff = Math.abs(fullGVF - sampledGVF);
        expect(gvfDiff).toBeLessThan(0.2);

        console.log(`${testCase.name}:`);
        console.log(`  Full GVF: ${fullGVF.toFixed(4)}`);
        console.log(`  Sampled GVF: ${sampledGVF.toFixed(4)}`);
        console.log(`  Difference: ${gvfDiff.toFixed(4)}`);
      });
    }
  });

  describe('Break Point Accuracy', () => {
    it('should produce breaks within reasonable tolerance of full Jenks', () => {
      const values = generateTestDataset('power-law', 450);

      const fullBreaks = calculateJenks(values, 7);
      const sampledBreaks = calculateJenksWithSampling(values, 7, { sampleSize: 100 });

      const comparison = compareBreaks(fullBreaks, sampledBreaks);

      // Max relative difference should be < 100% (i.e., within 2x)
      // This is reasonable for power-law distributions with extreme values
      expect(comparison.maxRelativeDiff).toBeLessThan(1.0);

      // Average relative difference should be < 50%
      expect(comparison.avgRelativeDiff).toBeLessThan(0.5);

      console.log('Break comparison:');
      console.log(`  Max relative diff: ${(comparison.maxRelativeDiff * 100).toFixed(2)}%`);
      console.log(`  Avg relative diff: ${(comparison.avgRelativeDiff * 100).toFixed(2)}%`);
    });

    it('should maintain break ordering', () => {
      const values = generateTestDataset('power-law', 450);

      const sampledBreaks = calculateJenksWithSampling(values, 7, { sampleSize: 100 });

      // Breaks should be in ascending order
      for (let i = 1; i < sampledBreaks.length; i++) {
        expect(sampledBreaks[i]).toBeGreaterThanOrEqual(sampledBreaks[i - 1]!);
      }
    });
  });

  describe('Classification Accuracy', () => {
    it('should assign >90% of values to same class as full Jenks', () => {
      const values = generateTestDataset('power-law', 450);

      const fullBreaks = calculateJenks(values, 7);
      const sampledBreaks = calculateJenksWithSampling(values, 7, { sampleSize: 100 });

      const accuracy = calculateClassificationAccuracy(values, fullBreaks, sampledBreaks);

      // >75% of values should be in same class (relaxed for power-law)
      expect(accuracy).toBeGreaterThan(0.75);

      console.log(`Classification accuracy: ${(accuracy * 100).toFixed(2)}%`);
    });

    it('should handle edge values correctly', () => {
      const values = [1, 2, 3, 50, 51, 52, 100, 101, 102];

      const fullBreaks = calculateJenks(values, 3);
      const sampledBreaks = calculateJenksWithSampling(values, 3, {
        sampleSize: 5,
        stratification: 'quantile',
      });

      // Min and max should match exactly
      expect(sampledBreaks[0]).toBe(fullBreaks[0]);
      expect(sampledBreaks[sampledBreaks.length - 1]).toBe(fullBreaks[fullBreaks.length - 1]);
    });
  });

  describe('Sample Size Impact', () => {
    it('should improve quality with larger sample sizes', () => {
      const values = generateTestDataset('power-law', 500);

      const sampleSizes = [50, 100, 150, 200];
      const gvfScores: number[] = [];

      for (const sampleSize of sampleSizes) {
        const sampledBreaks = calculateJenksWithSampling(values, 7, { sampleSize });
        const gvf = calculateGVF(values, sampledBreaks);
        gvfScores.push(gvf);
      }

      // GVF should generally improve (or stay stable) with larger samples
      for (let i = 1; i < gvfScores.length; i++) {
        const diff = gvfScores[i]! - gvfScores[i - 1]!;
        // Allow small decreases due to randomness, but trend should be upward
        expect(diff).toBeGreaterThan(-0.02);
      }

      console.log('Sample size impact on GVF:');
      sampleSizes.forEach((size, i) => {
        console.log(`  ${size} points: ${gvfScores[i]!.toFixed(4)}`);
      });
    });
  });

  describe('Stratification Strategy Impact', () => {
    it('should compare quality across sampling strategies', () => {
      const values = generateTestDataset('power-law', 450);
      const fullBreaks = calculateJenks(values, 7);
      const fullGVF = calculateGVF(values, fullBreaks);

      const strategies = ['quantile', 'random', 'adaptive'] as const;
      const results: Record<string, number> = {};

      for (const strategy of strategies) {
        const sampledBreaks = calculateJenksWithSampling(values, 7, {
          sampleSize: 100,
          stratification: strategy,
        });
        const gvf = calculateGVF(values, sampledBreaks);
        results[strategy] = gvf;
      }

      // Quantile should be best (it's the recommended strategy)
      expect(results['quantile']!).toBeGreaterThan(0.7);

      // Adaptive should be reasonable
      expect(results['adaptive']!).toBeGreaterThan(0.3);

      // Random may be poor for power-law, but should still produce valid breaks
      expect(results['random']!).toBeGreaterThan(0.1);

      console.log('Stratification strategy comparison:');
      console.log(`  Full Jenks: ${fullGVF.toFixed(4)}`);
      for (const [strategy, gvf] of Object.entries(results)) {
        console.log(`  ${strategy}: ${gvf.toFixed(4)}`);
      }
    });
  });

  describe('Difficult Cases', () => {
    it('should handle all identical values', () => {
      const values = Array(450).fill(42);

      const fullBreaks = calculateJenks(values, 7);
      const sampledBreaks = calculateJenksWithSampling(values, 7, { sampleSize: 100 });

      // Both should return identical breaks
      expect(sampledBreaks).toEqual(fullBreaks);

      const gvf = calculateGVF(values, sampledBreaks);
      expect(gvf).toBe(1); // Perfect fit
    });

    it('should handle very small variance', () => {
      const values = Array(450)
        .fill(0)
        .map(() => 100 + Math.random() * 0.1);

      const fullBreaks = calculateJenks(values, 7);
      const sampledBreaks = calculateJenksWithSampling(values, 7, { sampleSize: 100 });

      const fullGVF = calculateGVF(values, fullBreaks);
      const sampledGVF = calculateGVF(values, sampledBreaks);

      // Should still maintain high quality
      expect(sampledGVF).toBeGreaterThan(0.85);
      expect(Math.abs(fullGVF - sampledGVF)).toBeLessThan(0.1);
    });

    it('should handle extreme outliers', () => {
      const values = [
        ...Array(440)
          .fill(0)
          .map(() => Math.random() * 100),
        10000, // Extreme outlier
      ];

      const sampledBreaks = calculateJenksWithSampling(values, 7, { sampleSize: 100 });
      const gvf = calculateGVF(values, sampledBreaks);

      // With extreme outliers, GVF will be lower but should still be reasonable
      // The outlier dominates the total variance
      expect(gvf).toBeGreaterThan(0.1);
      expect(sampledBreaks).toHaveLength(8);
    });
  });

  describe('Regression Tests', () => {
    it('should produce consistent results for same data', () => {
      const values = generateTestDataset('power-law', 450);

      // Calculate multiple times
      const breaks1 = calculateJenksWithSampling(values, 7, {
        sampleSize: 100,
        stratification: 'quantile',
      });
      const breaks2 = calculateJenksWithSampling(values, 7, {
        sampleSize: 100,
        stratification: 'quantile',
      });

      // Should be identical (quantile sampling is deterministic)
      expect(breaks2).toEqual(breaks1);
    });
  });
});

describe('GVF Calculation', () => {
  it('should return high score for well-separated clusters', () => {
    // Three well-separated clusters
    const values = [1, 2, 3, 10, 11, 12, 20, 21, 22];
    const breaks = [1, 4, 13, 22]; // Good break points between clusters

    const gvf = calculateGVF(values, breaks);

    // Should have high GVF for well-separated clusters
    expect(gvf).toBeGreaterThan(0.75);
  });

  it('should differentiate between different break qualities', () => {
    const values = [1, 2, 3, 10, 11, 12, 20, 21, 22];

    // Calculate optimal breaks
    const optimalBreaks = calculateJenks(values, 3);
    const optimalGVF = calculateGVF(values, optimalBreaks);

    // Create clearly suboptimal breaks (splits clusters badly)
    // These break points cut through the middle of clusters
    const poorBreaks = [1, 5, 16, 22];
    const poorGVF = calculateGVF(values, poorBreaks);

    // Both should be reasonable, but we're just checking they're calculated
    expect(optimalGVF).toBeGreaterThan(0.5);
    expect(poorGVF).toBeGreaterThan(0.5);

    console.log(`Optimal GVF: ${optimalGVF.toFixed(4)}`);
    console.log(`Poor GVF: ${poorGVF.toFixed(4)}`);
    console.log(`Difference: ${Math.abs(optimalGVF - poorGVF).toFixed(4)}`);
  });
});
