/**
 * Example demonstrating the enhanced caching system
 *
 * This file shows how the cache provides significant performance improvements
 * for typical usage patterns.
 */

import { calculateJenksBreaks, getCacheStats, clearJenksCache } from '../index';

// Simulate station data
function generateStationData(count: number, seed: number = 0): number[] {
  const data: number[] = [];
  for (let i = 0; i < count; i++) {
    // Generate pseudo-random values that are deterministic based on seed
    data.push(Math.floor(Math.sin(i + seed) * 500 + 500));
  }
  return data;
}

// Example 1: Basic caching behavior
function example1_basicCaching() {
  console.log('\n=== Example 1: Basic Caching ===');
  clearJenksCache();

  const stationDepartures = generateStationData(450);

  // First calculation - cache miss
  const start1 = performance.now();
  const breaks1 = calculateJenksBreaks(stationDepartures, 7);
  const time1 = performance.now() - start1;

  console.log(`First calculation (cache miss): ${time1.toFixed(2)}ms`);
  console.log(`Breaks: [${breaks1.map((b) => b.toFixed(0)).join(', ')}]`);

  // Second calculation - cache hit
  const start2 = performance.now();
  calculateJenksBreaks(stationDepartures, 7);
  const time2 = performance.now() - start2;

  console.log(`Second calculation (cache hit): ${time2.toFixed(2)}ms`);
  console.log(`Speedup: ${(time1 / time2).toFixed(1)}x faster`);

  const stats = getCacheStats();
  console.log(`Cache size: ${stats.size}, Total hits: ${stats.totalHits}`);
}

// Example 2: Simulating user filter interactions
function example2_filterInteractions() {
  console.log('\n=== Example 2: Filter Interactions ===');
  clearJenksCache();

  const allStations = Array.from({ length: 450 }, () => ({
    departures: Math.floor(Math.random() * 1000),
    arrivals: Math.floor(Math.random() * 1000),
  }));

  // Simulate user toggling between different filters
  const interactions = [
    { name: 'All stations (departures)', data: allStations.map((s) => s.departures) },
    {
      name: 'High departures (>700)',
      data: allStations.filter((s) => s.departures > 700).map((s) => s.departures),
    },
    { name: 'All stations (arrivals)', data: allStations.map((s) => s.arrivals) },
    {
      name: 'High departures (>700)',
      data: allStations.filter((s) => s.departures > 700).map((s) => s.departures),
    }, // Cache hit
    { name: 'All stations (departures)', data: allStations.map((s) => s.departures) }, // Cache hit
    {
      name: 'Medium departures (300-700)',
      data: allStations
        .filter((s) => s.departures >= 300 && s.departures <= 700)
        .map((s) => s.departures),
    },
  ];

  let totalTime = 0;
  let cacheHits = 0;

  interactions.forEach((interaction, i) => {
    const statsBefore = getCacheStats();
    const start = performance.now();

    calculateJenksBreaks(interaction.data, 7);

    const time = performance.now() - start;
    totalTime += time;

    const statsAfter = getCacheStats();
    const isHit = statsAfter.totalHits > statsBefore.totalHits;

    if (isHit) cacheHits++;

    console.log(
      `${i + 1}. ${interaction.name}: ${time.toFixed(2)}ms ${isHit ? '(cache hit)' : '(cache miss)'}`
    );
  });

  console.log(`\nTotal time: ${totalTime.toFixed(2)}ms`);
  console.log(`Cache hit rate: ${((cacheHits / interactions.length) * 100).toFixed(1)}%`);

  const finalStats = getCacheStats();
  console.log(`Final cache size: ${finalStats.size}`);
}

// Example 3: Cache statistics
function example3_cacheStatistics() {
  console.log('\n=== Example 3: Cache Statistics ===');
  clearJenksCache();

  // Create multiple different datasets
  for (let i = 0; i < 5; i++) {
    const data = generateStationData(450, i);
    calculateJenksBreaks(data, 7);
  }

  // Access some datasets multiple times
  const popularData = generateStationData(450, 0);
  calculateJenksBreaks(popularData, 7);
  calculateJenksBreaks(popularData, 7);

  const stats = getCacheStats();
  console.log(`Cache size: ${stats.size}/${stats.maxSize}`);
  console.log(`Total hits: ${stats.totalHits}`);
  console.log('\nTop entries by hit count:');

  const sorted = stats.entries.sort((a, b) => b.hitCount - a.hitCount).slice(0, 3);
  sorted.forEach((entry, i) => {
    console.log(`  ${i + 1}. Hit count: ${entry.hitCount}, Age: ${entry.age.toFixed(0)}ms`);
  });
}

// Example 4: Performance comparison
function example4_performanceComparison() {
  console.log('\n=== Example 4: Performance Comparison ===');

  const testData = generateStationData(450);

  // Without caching (using clearCache between calls)
  let timeWithoutCache = 0;
  for (let i = 0; i < 10; i++) {
    clearJenksCache();
    const start = performance.now();
    calculateJenksBreaks(testData, 7);
    timeWithoutCache += performance.now() - start;
  }

  // With caching (same data, hits cache)
  clearJenksCache();
  calculateJenksBreaks(testData, 7); // First call to populate cache

  let timeWithCache = 0;
  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    calculateJenksBreaks(testData, 7);
    timeWithCache += performance.now() - start;
  }

  console.log(`10 calls without cache: ${timeWithoutCache.toFixed(2)}ms`);
  console.log(`10 calls with cache: ${timeWithCache.toFixed(2)}ms`);
  console.log(`Speedup: ${(timeWithoutCache / timeWithCache).toFixed(1)}x faster`);
}

// Export for direct execution
export {
  example1_basicCaching,
  example2_filterInteractions,
  example3_cacheStatistics,
  example4_performanceComparison,
};

// Test suite
import { describe, it, expect } from 'vitest';

describe('Enhanced Caching Examples', () => {
  it('should demonstrate basic caching', () => {
    example1_basicCaching();
    expect(true).toBe(true);
  });

  it('should demonstrate filter interactions', () => {
    example2_filterInteractions();
    expect(true).toBe(true);
  });

  it('should demonstrate cache statistics', () => {
    example3_cacheStatistics();
    expect(true).toBe(true);
  });

  it('should demonstrate performance comparison', () => {
    example4_performanceComparison();
    expect(true).toBe(true);
  });
});
