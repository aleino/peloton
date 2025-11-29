import { describe, it, expect, beforeEach } from 'vitest';
import { calculateJenksBreaks, getCacheStats, clearJenksCache } from '../calculateJenksBreaks';

describe('calculateJenksBreaks with caching', () => {
  beforeEach(() => {
    clearJenksCache();
  });

  describe('cache behavior', () => {
    it('should cache calculation results', () => {
      const values = Array.from({ length: 200 }, (_, i) => i);

      // First call - cache miss
      const breaks1 = calculateJenksBreaks(values, 7);
      const stats1 = getCacheStats();
      expect(stats1.size).toBe(1);
      expect(stats1.totalHits).toBe(1);

      // Second call with same data - cache hit
      const breaks2 = calculateJenksBreaks(values, 7);
      const stats2 = getCacheStats();
      expect(stats2.size).toBe(1);
      expect(stats2.totalHits).toBe(2);

      // Results should be identical
      expect(breaks2).toEqual(breaks1);
    });

    it('should cache different numClasses separately', () => {
      const values = Array.from({ length: 200 }, (_, i) => i);

      calculateJenksBreaks(values, 5);
      calculateJenksBreaks(values, 7);
      calculateJenksBreaks(values, 11);

      const stats = getCacheStats();
      expect(stats.size).toBe(3); // 3 different cache entries
    });

    it('should recognize similar distributions', () => {
      // Two arrays with same distribution but different instances
      const values1 = Array.from({ length: 200 }, (_, i) => i);
      const values2 = Array.from({ length: 200 }, (_, i) => i);

      calculateJenksBreaks(values1, 7);
      const stats1 = getCacheStats();
      expect(stats1.totalHits).toBe(1);

      // Should hit cache even though it's a different array
      calculateJenksBreaks(values2, 7);
      const stats2 = getCacheStats();
      expect(stats2.totalHits).toBe(2);
      expect(stats2.size).toBe(1); // Still just one entry
    });

    it('should distinguish different distributions', () => {
      const values1 = Array.from({ length: 200 }, (_, i) => i);
      const values2 = Array.from({ length: 200 }, (_, i) => i * 2);

      calculateJenksBreaks(values1, 7);
      calculateJenksBreaks(values2, 7);

      const stats = getCacheStats();
      expect(stats.size).toBe(2); // Different distributions
    });

    it('should handle empty arrays', () => {
      const breaks = calculateJenksBreaks([], 7);
      expect(breaks).toEqual([]);

      const stats = getCacheStats();
      expect(stats.size).toBe(0); // Empty arrays don't get cached
    });

    it('should filter invalid values and cache valid subset', () => {
      const values = [1, 2, NaN, 4, 5, Infinity, 7, 8, 9, 10];

      const breaks1 = calculateJenksBreaks(values, 3);
      expect(breaks1.length).toBeGreaterThan(0);

      const stats1 = getCacheStats();
      expect(stats1.size).toBe(1);

      // Same values should hit cache
      const breaks2 = calculateJenksBreaks([1, 2, NaN, 4, 5, Infinity, 7, 8, 9, 10], 3);
      expect(breaks2).toEqual(breaks1);

      const stats2 = getCacheStats();
      expect(stats2.totalHits).toBe(2);
    });
  });

  describe('LRU eviction', () => {
    it('should evict old entries when cache is full', () => {
      // Fill cache beyond limit (maxSize = 50)
      for (let i = 0; i < 55; i++) {
        const values = Array.from({ length: 100 }, (_, j) => j + i * 1000);
        calculateJenksBreaks(values, 7);
      }

      const stats = getCacheStats();

      // Should have evicted some entries
      expect(stats.size).toBeLessThanOrEqual(50);
      expect(stats.size).toBeGreaterThan(40); // But not too aggressive
    });

    it('should keep most recently used entries', () => {
      clearJenksCache();

      // Create a distinct dataset
      const importantData = Array.from({ length: 100 }, (_, i) => i + 99999);

      // Add and access it multiple times to increase hit count
      calculateJenksBreaks(importantData, 7);
      calculateJenksBreaks(importantData, 7);
      calculateJenksBreaks(importantData, 7);

      // Fill cache almost to the limit
      for (let i = 0; i < 48; i++) {
        const values = Array.from({ length: 100 }, (_, j) => j + i * 1000);
        calculateJenksBreaks(values, 7);
      }

      // Access importantData again to make it recent
      calculateJenksBreaks(importantData, 7);

      // Add a few more entries to trigger eviction
      for (let i = 48; i < 53; i++) {
        const values = Array.from({ length: 100 }, (_, j) => j + i * 1000);
        calculateJenksBreaks(values, 7);
      }

      const stats = getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(50);

      // importantData should still be in cache (has high hit count and was accessed recently)
      const importantEntry = stats.entries.find((e) => e.hitCount === 4);
      expect(importantEntry).toBeDefined();
    });
  });

  describe('cache key generation', () => {
    it('should generate consistent keys for same data', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      calculateJenksBreaks(values, 5);
      calculateJenksBreaks([...values], 5); // Different array, same values

      const stats = getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.totalHits).toBe(2);
    });

    it('should generate different keys for different data shapes', () => {
      const uniform = Array.from({ length: 100 }, (_, i) => i);
      const skewed = [
        ...Array(80)
          .fill(0)
          .map(() => Math.random() * 10),
        ...Array(20)
          .fill(0)
          .map(() => 90 + Math.random() * 10),
      ];

      calculateJenksBreaks(uniform, 7);
      calculateJenksBreaks(skewed, 7);

      const stats = getCacheStats();
      expect(stats.size).toBe(2); // Different distributions
    });

    it('should handle data with different lengths', () => {
      const short = Array.from({ length: 50 }, (_, i) => i);
      const long = Array.from({ length: 200 }, (_, i) => i);

      calculateJenksBreaks(short, 7);
      calculateJenksBreaks(long, 7);

      const stats = getCacheStats();
      expect(stats.size).toBe(2); // Different lengths
    });
  });

  describe('cache utilities', () => {
    it('should clear cache', () => {
      const values = Array.from({ length: 100 }, (_, i) => i);

      calculateJenksBreaks(values, 7);
      expect(getCacheStats().size).toBe(1);

      clearJenksCache();
      expect(getCacheStats().size).toBe(0);
    });

    it('should provide accurate statistics', () => {
      clearJenksCache();

      const values = Array.from({ length: 100 }, (_, i) => i);

      // First call
      calculateJenksBreaks(values, 7);
      let stats = getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.totalHits).toBe(1);
      expect(stats.maxSize).toBe(50);

      // Second call (cache hit)
      calculateJenksBreaks(values, 7);
      stats = getCacheStats();
      expect(stats.totalHits).toBe(2);

      // Third call (cache hit)
      calculateJenksBreaks(values, 7);
      stats = getCacheStats();
      expect(stats.totalHits).toBe(3);
    });

    it('should track hit counts per entry', () => {
      const data1 = Array.from({ length: 100 }, (_, i) => i);
      const data2 = Array.from({ length: 100 }, (_, i) => i + 1000);

      // data1: 3 hits
      calculateJenksBreaks(data1, 7);
      calculateJenksBreaks(data1, 7);
      calculateJenksBreaks(data1, 7);

      // data2: 2 hits
      calculateJenksBreaks(data2, 7);
      calculateJenksBreaks(data2, 7);

      const stats = getCacheStats();
      expect(stats.size).toBe(2);

      const entries = stats.entries.sort((a, b) => b.hitCount - a.hitCount);
      expect(entries[0]?.hitCount).toBe(3);
      expect(entries[1]?.hitCount).toBe(2);
    });

    it('should track age of entries', () => {
      const values = Array.from({ length: 100 }, (_, i) => i);

      calculateJenksBreaks(values, 7);

      // Wait a bit
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Small delay
      }

      const stats = getCacheStats();
      expect(stats.entries[0]?.age).toBeGreaterThan(0);
    });
  });

  describe('integration with sampling', () => {
    it('should use sampling for large datasets', () => {
      const largeDataset = Array.from({ length: 500 }, (_, i) => i);

      // Should automatically use sampling (sampleSize default is 100)
      const breaks = calculateJenksBreaks(largeDataset, 7);

      expect(breaks.length).toBe(8); // numClasses + 1
      expect(breaks[0]).toBe(0); // min
      expect(breaks[breaks.length - 1]).toBe(499); // max

      const stats = getCacheStats();
      expect(stats.size).toBe(1);
    });

    it('should respect forceFull option', () => {
      const largeDataset = Array.from({ length: 500 }, (_, i) => i);

      const breaks1 = calculateJenksBreaks(largeDataset, 7, { forceFull: false });
      const breaks2 = calculateJenksBreaks(largeDataset, 7, { forceFull: true });

      // Both should be cached
      const stats = getCacheStats();
      expect(stats.size).toBe(1); // Same cache key

      // Results should be similar (within reasonable bounds)
      expect(breaks1.length).toBe(breaks2.length);
    });

    it('should use custom sample size', () => {
      const largeDataset = Array.from({ length: 500 }, (_, i) => i);

      const breaks = calculateJenksBreaks(largeDataset, 7, { sampleSize: 150 });

      expect(breaks.length).toBe(8);

      const stats = getCacheStats();
      expect(stats.size).toBe(1);
    });
  });
});

describe('cache performance', () => {
  beforeEach(() => {
    clearJenksCache();
  });

  it('should be significantly faster for cache hits', () => {
    const values = Array.from({ length: 500 }, () => Math.random() * 1000);

    // First call - cache miss
    const missStart = performance.now();
    calculateJenksBreaks(values, 7);
    const missTime = performance.now() - missStart;

    // Second call - cache hit
    const hitStart = performance.now();
    calculateJenksBreaks(values, 7);
    const hitTime = performance.now() - hitStart;

    // Cache hit should be at least 10x faster
    expect(hitTime * 10).toBeLessThan(missTime);

    // Cache hit should be < 1ms
    expect(hitTime).toBeLessThan(1);
  });

  it('should handle rapid consecutive calls efficiently', () => {
    const values = Array.from({ length: 200 }, (_, i) => i);

    const start = performance.now();

    // Make 100 calls with the same data
    for (let i = 0; i < 100; i++) {
      calculateJenksBreaks(values, 7);
    }

    const totalTime = performance.now() - start;

    // Should complete in reasonable time (< 100ms for 100 calls)
    expect(totalTime).toBeLessThan(100);

    const stats = getCacheStats();
    expect(stats.size).toBe(1);
    expect(stats.totalHits).toBe(100);
  });
});

describe('cache hit rate in realistic scenarios', () => {
  beforeEach(() => {
    clearJenksCache();
  });

  it('should achieve high hit rate with typical filter interactions', () => {
    // Simulate user filtering stations by different criteria
    // but often returning to same filters

    const allStations = Array.from({ length: 450 }, (_, i) => ({
      id: i,
      departures: Math.floor(Math.random() * 1000),
      arrivals: Math.floor(Math.random() * 1000),
    }));

    const interactions = [
      // Filter by high departures
      () => allStations.filter((s) => s.departures > 500).map((s) => s.departures),
      // All stations departures
      () => allStations.map((s) => s.departures),
      // Filter by high arrivals
      () => allStations.filter((s) => s.arrivals > 500).map((s) => s.arrivals),
      // Back to high departures (should hit cache)
      () => allStations.filter((s) => s.departures > 500).map((s) => s.departures),
      // All stations again (should hit cache)
      () => allStations.map((s) => s.departures),
      // New filter
      () => allStations.filter((s) => s.departures > 700).map((s) => s.departures),
      // Back to high departures again (should hit cache)
      () => allStations.filter((s) => s.departures > 500).map((s) => s.departures),
      // All stations again (should hit cache)
      () => allStations.map((s) => s.departures),
    ];

    let totalCalls = 0;
    let cacheHits = 0;

    for (const interaction of interactions) {
      const values = interaction();
      const statsBefore = getCacheStats();
      const hitsBefore = statsBefore.totalHits;

      calculateJenksBreaks(values, 7);
      totalCalls++;

      const statsAfter = getCacheStats();
      const hitsAfter = statsAfter.totalHits;

      if (hitsAfter > hitsBefore) {
        cacheHits++;
      }
    }

    const hitRate = cacheHits / totalCalls;

    // Should achieve > 30% hit rate in this scenario
    expect(hitRate).toBeGreaterThan(0.3);
  });

  it('should maintain cache efficiency with varied interactions', () => {
    const allStations = Array.from({ length: 450 }, (_, i) => ({
      id: i,
      value: Math.floor(Math.random() * 1000),
    }));

    // Simulate 50 filter interactions
    const interactions = [];
    for (let i = 0; i < 50; i++) {
      // Mix of different filters
      if (i % 5 === 0) {
        // All stations (should hit cache after first call)
        interactions.push(() => allStations.map((s) => s.value));
      } else if (i % 5 === 1) {
        // High values (should hit cache after first call)
        interactions.push(() => allStations.filter((s) => s.value > 700).map((s) => s.value));
      } else if (i % 5 === 2) {
        // Low values (should hit cache after first call)
        interactions.push(() => allStations.filter((s) => s.value < 300).map((s) => s.value));
      } else if (i % 5 === 3) {
        // Medium values (should hit cache after first call)
        interactions.push(() =>
          allStations.filter((s) => s.value >= 300 && s.value <= 700).map((s) => s.value)
        );
      } else {
        // Random threshold (less likely to hit cache)
        const threshold = Math.floor(Math.random() * 1000);
        interactions.push(() => allStations.filter((s) => s.value > threshold).map((s) => s.value));
      }
    }

    // Execute interactions
    for (const interaction of interactions) {
      const values = interaction();
      calculateJenksBreaks(values, 7);
    }

    const stats = getCacheStats();

    // Should have reasonable cache size (not every interaction creates new entry)
    expect(stats.size).toBeLessThan(30);

    // Should have good hit rate (total hits >= total calls)
    // Due to random thresholds, we may not always exceed 50, but should be at least 50
    expect(stats.totalHits).toBeGreaterThanOrEqual(50);
  });
});
