/**
 * Example usage of color scale transformations
 *
 * This file demonstrates how different transformations affect color distribution
 * for skewed data (e.g., when a few stations have extremely high traffic).
 */

import { createViridisScale } from './colorScales';

// Example station data with skewed distribution (realistic scenario)
const exampleDepartures = [
  10,
  25,
  30,
  45,
  60,
  70,
  85,
  100,
  120,
  150, // Low traffic stations
  200,
  250,
  300,
  400,
  500, // Medium traffic
  1000,
  1500, // High traffic
  5000,
  10000,
  50000, // Extreme outliers (e.g., central Helsinki stations)
];

const min = Math.min(...exampleDepartures);
const max = Math.max(...exampleDepartures);

console.log('\n📊 Station Traffic Distribution:');
console.log(`Min: ${min}, Max: ${max}, Range: ${max - min}`);

// Linear scale - most stations will be purple
const linearScale = createViridisScale(min, max, 'linear');
console.log('\n🟣 Linear Scale (default):');
console.log('  Low traffic (100):     ', linearScale(100));
console.log('  Medium traffic (500):  ', linearScale(500));
console.log('  High traffic (5000):   ', linearScale(5000));
console.log('  Problem: Most stations compressed into purple range!');

// Logarithmic scale - more uniform color distribution
const logScale = createViridisScale(min, max, 'log');
console.log('\n🌈 Logarithmic Scale (recommended for skewed data):');
console.log('  Low traffic (100):     ', logScale(100));
console.log('  Medium traffic (500):  ', logScale(500));
console.log('  High traffic (5000):   ', logScale(5000));
console.log('  Benefit: Better color spread across all stations!');

// Square root scale - moderate compression
const sqrtScale = createViridisScale(min, max, 'sqrt');
console.log('\n🟡 Square Root Scale (moderate):');
console.log('  Low traffic (100):     ', sqrtScale(100));
console.log('  Medium traffic (500):  ', sqrtScale(500));
console.log('  High traffic (5000):   ', sqrtScale(5000));
console.log('  Benefit: Less aggressive than log, still helps with outliers');

/**
 * When to use each transformation:
 *
 * 🟣 LINEAR (default):
 *    - Use when data is normally distributed
 *    - Use when you want to emphasize differences in high-traffic stations
 *    - Problem: Most stations appear same color if outliers exist
 *
 * 🌈 LOGARITHMIC (recommended for skewed data):
 *    - Use when a few stations dominate the range (e.g., central vs suburban)
 *    - Provides most uniform color distribution
 *    - Best for exploring patterns across all station types
 *
 * 🟡 SQUARE ROOT (moderate):
 *    - Middle ground between linear and log
 *    - Less aggressive compression than log
 *    - Good when outliers exist but aren't extreme
 */
