import { describe, it, expect } from 'vitest';
import { flattenStationMetrics, calculateRelativeDifference } from './useStationsQuery.utils';
import type { StationsListResponseBody } from '@peloton/shared';

describe('flattenStationMetrics', () => {
  it('should flatten all departure metrics', () => {
    const mockData: StationsListResponseBody = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: '001',
          geometry: {
            type: 'Point',
            coordinates: [24.9384, 60.1699],
          },
          properties: {
            stationId: '001',
            name: 'Test Station',
            tripStatistics: {
              departures: {
                tripsCount: 1523,
                durationSecondsAvg: 895,
                distanceMetersAvg: 2340,
              },
              returns: {
                tripsCount: 1489,
                durationSecondsAvg: 920,
                distanceMetersAvg: 2380,
              },
            },
          },
        },
      ],
    };

    const result = flattenStationMetrics(mockData);

    expect(result.features[0].properties.departuresCount).toBe(1523);
    expect(result.features[0].properties.departuresDurationAvg).toBe(895);
    expect(result.features[0].properties.departuresDistanceAvg).toBe(2340);
  });

  it('should flatten all return metrics', () => {
    const mockData: StationsListResponseBody = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: '001',
          geometry: {
            type: 'Point',
            coordinates: [24.9384, 60.1699],
          },
          properties: {
            stationId: '001',
            name: 'Test Station',
            tripStatistics: {
              departures: {
                tripsCount: 1523,
                durationSecondsAvg: 895,
                distanceMetersAvg: 2340,
              },
              returns: {
                tripsCount: 1489,
                durationSecondsAvg: 920,
                distanceMetersAvg: 2380,
              },
            },
          },
        },
      ],
    };

    const result = flattenStationMetrics(mockData);

    expect(result.features[0].properties.returnsCount).toBe(1489);
    expect(result.features[0].properties.returnsDurationAvg).toBe(920);
    expect(result.features[0].properties.returnsDistanceAvg).toBe(2380);
  });

  it('should preserve original tripStatistics', () => {
    const mockData: StationsListResponseBody = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: '001',
          geometry: {
            type: 'Point',
            coordinates: [24.9384, 60.1699],
          },
          properties: {
            stationId: '001',
            name: 'Test Station',
            tripStatistics: {
              departures: {
                tripsCount: 1523,
                durationSecondsAvg: 895,
                distanceMetersAvg: 2340,
              },
              returns: {
                tripsCount: 1489,
                durationSecondsAvg: 920,
                distanceMetersAvg: 2380,
              },
            },
          },
        },
      ],
    };

    const result = flattenStationMetrics(mockData);

    expect(result.features[0].properties.tripStatistics).toEqual({
      departures: {
        tripsCount: 1523,
        durationSecondsAvg: 895,
        distanceMetersAvg: 2340,
      },
      returns: {
        tripsCount: 1489,
        durationSecondsAvg: 920,
        distanceMetersAvg: 2380,
      },
    });
  });

  it('should maintain backwards compatibility with totalDepartures', () => {
    const mockData: StationsListResponseBody = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: '001',
          geometry: {
            type: 'Point',
            coordinates: [24.9384, 60.1699],
          },
          properties: {
            stationId: '001',
            name: 'Test Station',
            tripStatistics: {
              departures: {
                tripsCount: 1523,
                durationSecondsAvg: 895,
                distanceMetersAvg: 2340,
              },
              returns: {
                tripsCount: 1489,
                durationSecondsAvg: 920,
                distanceMetersAvg: 2380,
              },
            },
          },
        },
      ],
    };

    const result = flattenStationMetrics(mockData);

    expect(result.features[0].properties.totalDepartures).toBe(1523);
    expect(result.features[0].properties.totalDepartures).toBe(
      result.features[0].properties.departuresCount
    );
  });

  it('should handle missing tripStatistics gracefully', () => {
    const mockData: StationsListResponseBody = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: '002',
          geometry: {
            type: 'Point',
            coordinates: [24.9414, 60.1689],
          },
          properties: {
            stationId: '002',
            name: 'Station Without Stats',
          },
        },
      ],
    };

    const result = flattenStationMetrics(mockData);

    expect(result.features[0].properties.tripStatistics).toBeUndefined();
    expect(result.features[0].properties.departuresCount).toBeUndefined();
    expect(result.features[0].properties.departuresDurationAvg).toBeUndefined();
    expect(result.features[0].properties.departuresDistanceAvg).toBeUndefined();
    expect(result.features[0].properties.returnsCount).toBeUndefined();
    expect(result.features[0].properties.returnsDurationAvg).toBeUndefined();
    expect(result.features[0].properties.returnsDistanceAvg).toBeUndefined();
    expect(result.features[0].properties.totalDepartures).toBeUndefined();
  });

  it('should preserve base properties', () => {
    const mockData: StationsListResponseBody = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: '001',
          geometry: {
            type: 'Point',
            coordinates: [24.9384, 60.1699],
          },
          properties: {
            stationId: '001',
            name: 'Test Station',
            tripStatistics: {
              departures: {
                tripsCount: 1523,
                durationSecondsAvg: 895,
                distanceMetersAvg: 2340,
              },
              returns: {
                tripsCount: 1489,
                durationSecondsAvg: 920,
                distanceMetersAvg: 2380,
              },
            },
          },
        },
      ],
    };

    const result = flattenStationMetrics(mockData);

    expect(result.features[0].id).toBe('001');
    expect(result.features[0].properties.stationId).toBe('001');
    expect(result.features[0].properties.name).toBe('Test Station');
    expect(result.features[0].geometry).toEqual({
      type: 'Point',
      coordinates: [24.9384, 60.1699],
    });
  });

  it('should handle multiple stations', () => {
    const mockData: StationsListResponseBody = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: '001',
          geometry: {
            type: 'Point',
            coordinates: [24.9384, 60.1699],
          },
          properties: {
            stationId: '001',
            name: 'Station 1',
            tripStatistics: {
              departures: {
                tripsCount: 1523,
                durationSecondsAvg: 895,
                distanceMetersAvg: 2340,
              },
              returns: {
                tripsCount: 1489,
                durationSecondsAvg: 920,
                distanceMetersAvg: 2380,
              },
            },
          },
        },
        {
          type: 'Feature',
          id: '002',
          geometry: {
            type: 'Point',
            coordinates: [24.9414, 60.1689],
          },
          properties: {
            stationId: '002',
            name: 'Station 2',
          },
        },
      ],
    };

    const result = flattenStationMetrics(mockData);

    expect(result.features).toHaveLength(2);
    expect(result.features[0].properties.departuresCount).toBe(1523);
    expect(result.features[1].properties.departuresCount).toBeUndefined();
  });

  it('should return valid GeoJSON structure', () => {
    const mockData: StationsListResponseBody = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: '001',
          geometry: {
            type: 'Point',
            coordinates: [24.9384, 60.1699],
          },
          properties: {
            stationId: '001',
            name: 'Test Station',
            tripStatistics: {
              departures: {
                tripsCount: 1523,
                durationSecondsAvg: 895,
                distanceMetersAvg: 2340,
              },
              returns: {
                tripsCount: 1489,
                durationSecondsAvg: 920,
                distanceMetersAvg: 2380,
              },
            },
          },
        },
      ],
    };

    const result = flattenStationMetrics(mockData);

    expect(result.type).toBe('FeatureCollection');
    expect(Array.isArray(result.features)).toBe(true);
    expect(result.features[0].type).toBe('Feature');
    expect(result.features[0].geometry.type).toBe('Point');
  });
});

describe('calculateRelativeDifference', () => {
  it('should return 0 when both values are zero', () => {
    expect(calculateRelativeDifference(0, 0)).toBe(0);
  });

  it('should return 0 when both values are undefined', () => {
    expect(calculateRelativeDifference(undefined, undefined)).toBe(0);
  });

  it('should return 1.0 when only first value exists', () => {
    expect(calculateRelativeDifference(100, 0)).toBe(1.0);
  });

  it('should return -1.0 when only second value exists', () => {
    expect(calculateRelativeDifference(0, 100)).toBe(-1.0);
  });

  it('should return 0 when values are equal', () => {
    expect(calculateRelativeDifference(50, 50)).toBe(0);
  });

  it('should calculate positive difference correctly', () => {
    // 100 dep, 50 arr -> (100-50)/(100+50) = 50/150 = 0.333...
    const result = calculateRelativeDifference(100, 50);
    expect(result).toBeCloseTo(0.333, 2);
  });

  it('should calculate negative difference correctly', () => {
    // 50 dep, 100 arr -> (50-100)/(50+100) = -50/150 = -0.333...
    const result = calculateRelativeDifference(50, 100);
    expect(result).toBeCloseTo(-0.333, 2);
  });

  it('should handle one undefined value (first defined)', () => {
    expect(calculateRelativeDifference(100, undefined)).toBe(1.0);
  });

  it('should handle one undefined value (second defined)', () => {
    expect(calculateRelativeDifference(undefined, 100)).toBe(-1.0);
  });

  it('should handle large differences', () => {
    // 1000 dep, 10 arr -> (1000-10)/(1000+10) = 990/1010 = 0.98...
    const result = calculateRelativeDifference(1000, 10);
    expect(result).toBeCloseTo(0.98, 2);
  });

  it('should handle small differences', () => {
    // 51 dep, 49 arr -> (51-49)/(51+49) = 2/100 = 0.02
    const result = calculateRelativeDifference(51, 49);
    expect(result).toBeCloseTo(0.02, 2);
  });
});

describe('flattenStationMetrics with differences', () => {
  it('should add difference fields to flattened properties', () => {
    const mockData: StationsListResponseBody = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'test-1',
          geometry: {
            type: 'Point',
            coordinates: [24.9, 60.2],
          },
          properties: {
            stationId: 'test-1',
            name: 'Test Station',
            tripStatistics: {
              departures: {
                tripsCount: 100,
                durationSecondsAvg: 600,
                distanceMetersAvg: 2000,
              },
              returns: {
                tripsCount: 50,
                durationSecondsAvg: 500,
                distanceMetersAvg: 1500,
              },
            },
          },
        },
      ],
    };

    const result = flattenStationMetrics(mockData);
    const props = result.features[0]?.properties;

    // Check difference fields exist
    expect(props?.diffCount).toBeDefined();
    expect(props?.diffDurationAvg).toBeDefined();
    expect(props?.diffDistanceAvg).toBeDefined();

    // Check values are in valid range
    expect(props?.diffCount).toBeGreaterThanOrEqual(-1.0);
    expect(props?.diffCount).toBeLessThanOrEqual(1.0);

    // Check specific calculation
    // (100-50)/(100+50) = 50/150 = 0.333...
    expect(props?.diffCount).toBeCloseTo(0.333, 2);
  });

  it('should handle stations with no trip statistics', () => {
    const mockData: StationsListResponseBody = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'test-2',
          geometry: {
            type: 'Point',
            coordinates: [24.9, 60.2],
          },
          properties: {
            stationId: 'test-2',
            name: 'Test Station 2',
            // No tripStatistics
          },
        },
      ],
    };

    const result = flattenStationMetrics(mockData);
    const props = result.features[0]?.properties;

    // Should not have difference fields (they're in the conditional block)
    expect(props?.diffCount).toBeUndefined();
    expect(props?.diffDurationAvg).toBeUndefined();
    expect(props?.diffDistanceAvg).toBeUndefined();
  });

  it('should calculate negative difference when more arrivals than departures', () => {
    const mockData: StationsListResponseBody = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'test-3',
          geometry: {
            type: 'Point',
            coordinates: [24.9, 60.2],
          },
          properties: {
            stationId: 'test-3',
            name: 'Destination Station',
            tripStatistics: {
              departures: {
                tripsCount: 50,
                durationSecondsAvg: 500,
                distanceMetersAvg: 1500,
              },
              returns: {
                tripsCount: 150,
                durationSecondsAvg: 700,
                distanceMetersAvg: 2500,
              },
            },
          },
        },
      ],
    };

    const result = flattenStationMetrics(mockData);
    const props = result.features[0]?.properties;

    // (50-150)/(50+150) = -100/200 = -0.5
    expect(props?.diffCount).toBeCloseTo(-0.5, 2);

    // Check all differences are negative
    expect(props?.diffCount).toBeLessThan(0);
    expect(props?.diffDurationAvg).toBeLessThan(0);
    expect(props?.diffDistanceAvg).toBeLessThan(0);
  });

  it('should calculate zero difference for balanced stations', () => {
    const mockData: StationsListResponseBody = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'test-4',
          geometry: {
            type: 'Point',
            coordinates: [24.9, 60.2],
          },
          properties: {
            stationId: 'test-4',
            name: 'Balanced Station',
            tripStatistics: {
              departures: {
                tripsCount: 100,
                durationSecondsAvg: 600,
                distanceMetersAvg: 2000,
              },
              returns: {
                tripsCount: 100,
                durationSecondsAvg: 600,
                distanceMetersAvg: 2000,
              },
            },
          },
        },
      ],
    };

    const result = flattenStationMetrics(mockData);
    const props = result.features[0]?.properties;

    expect(props?.diffCount).toBe(0);
    expect(props?.diffDurationAvg).toBe(0);
    expect(props?.diffDistanceAvg).toBe(0);
  });

  it('should calculate differences for all three metrics independently', () => {
    const mockData: StationsListResponseBody = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'test-5',
          geometry: {
            type: 'Point',
            coordinates: [24.9, 60.2],
          },
          properties: {
            stationId: 'test-5',
            name: 'Mixed Metrics Station',
            tripStatistics: {
              departures: {
                tripsCount: 150, // More departures
                durationSecondsAvg: 500, // Less duration
                distanceMetersAvg: 2000, // Equal distance
              },
              returns: {
                tripsCount: 50,
                durationSecondsAvg: 700,
                distanceMetersAvg: 2000,
              },
            },
          },
        },
      ],
    };

    const result = flattenStationMetrics(mockData);
    const props = result.features[0]?.properties;

    // Count: more departures (positive)
    expect(props?.diffCount).toBeGreaterThan(0);
    expect(props?.diffCount).toBeCloseTo(0.5, 2);

    // Duration: less departure duration (negative)
    expect(props?.diffDurationAvg).toBeLessThan(0);

    // Distance: equal (zero)
    expect(props?.diffDistanceAvg).toBe(0);
  });
});
