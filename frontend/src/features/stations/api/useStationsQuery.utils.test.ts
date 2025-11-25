import { describe, it, expect } from 'vitest';
import { flattenStationMetrics } from './useStationsQuery.utils';
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
