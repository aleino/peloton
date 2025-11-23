import { describe, it, expect } from 'vitest';
import {
  station,
  stationStatistics,
  stationDetail,
  stationFeature,
  stationFeatureCollection,
  stationsGetQueryParams,
  stationsGetPathParams,
  stationsListResponseBody,
  stationsGetResponseBody,
  tripDirectionStatistics,
  stationTripStatistics,
  stationFeatureProperties,
  type TripDirectionStatistics,
  type StationTripStatistics,
  type StationFeatureProperties,
} from '../src/schemas/station.schema';
import { location } from '../src/schemas/geospatial.schema';

describe('location', () => {
  it('should validate a valid location', () => {
    const validLocation = {
      type: 'Point',
      coordinates: [24.9384, 60.1699], // Helsinki coordinates [lon, lat]
    };

    const result = location.safeParse(validLocation);
    expect(result.success).toBe(true);
  });

  it('should reject longitude out of range', () => {
    const invalidLocation = {
      type: 'Point',
      coordinates: [200, 60.1699], // longitude > 180
    };

    const result = location.safeParse(invalidLocation);
    expect(result.success).toBe(false);
  });

  it('should reject latitude out of range', () => {
    const invalidLocation = {
      type: 'Point',
      coordinates: [24.9384, 100], // latitude > 90
    };

    const result = location.safeParse(invalidLocation);
    expect(result.success).toBe(false);
  });

  it('should reject wrong type', () => {
    const invalidLocation = {
      type: 'LineString',
      coordinates: [24.9384, 60.1699],
    };

    const result = location.safeParse(invalidLocation);
    expect(result.success).toBe(false);
  });
});

describe('station', () => {
  const validStation = {
    stationId: '001',
    name: 'Kaivopuisto',
    location: {
      type: 'Point',
      coordinates: [24.9384, 60.1699],
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('should validate a valid station', () => {
    const result = station.safeParse(validStation);
    expect(result.success).toBe(true);
  });

  it('should reject empty stationId', () => {
    const invalidStation = { ...validStation, stationId: '' };
    const result = station.safeParse(invalidStation);
    expect(result.success).toBe(false);
  });

  it('should reject stationId longer than 50 characters', () => {
    const invalidStation = {
      ...validStation,
      stationId: 'a'.repeat(51),
    };
    const result = station.safeParse(invalidStation);
    expect(result.success).toBe(false);
  });

  it('should reject empty name', () => {
    const invalidStation = { ...validStation, name: '' };
    const result = station.safeParse(invalidStation);
    expect(result.success).toBe(false);
  });

  it('should reject name longer than 255 characters', () => {
    const invalidStation = {
      ...validStation,
      name: 'a'.repeat(256),
    };
    const result = station.safeParse(invalidStation);
    expect(result.success).toBe(false);
  });

  it('should reject invalid coordinates', () => {
    const invalidStation = {
      ...validStation,
      location: {
        type: 'Point',
        coordinates: [200, 100], // out of range
      },
    };
    const result = station.safeParse(invalidStation);
    expect(result.success).toBe(false);
  });

  it('should reject invalid datetime format', () => {
    const invalidStation = {
      ...validStation,
      createdAt: 'invalid-date',
    };
    const result = station.safeParse(invalidStation);
    expect(result.success).toBe(false);
  });
});

describe('stationStatistics', () => {
  const validStats = {
    totalDepartures: 1523,
    totalArrivals: 1489,
    avgTripDurationSeconds: 895,
    avgTripDistanceMeters: 2340,
    busiestHour: 17,
    busiestDay: 2,
  };

  it('should validate valid statistics', () => {
    const result = stationStatistics.safeParse(validStats);
    expect(result.success).toBe(true);
  });

  it('should reject negative departures', () => {
    const invalidStats = { ...validStats, totalDepartures: -1 };
    const result = stationStatistics.safeParse(invalidStats);
    expect(result.success).toBe(false);
  });

  it('should reject negative arrivals', () => {
    const invalidStats = { ...validStats, totalArrivals: -1 };
    const result = stationStatistics.safeParse(invalidStats);
    expect(result.success).toBe(false);
  });

  it('should reject negative duration', () => {
    const invalidStats = { ...validStats, avgTripDurationSeconds: -1 };
    const result = stationStatistics.safeParse(invalidStats);
    expect(result.success).toBe(false);
  });

  it('should reject negative distance', () => {
    const invalidStats = { ...validStats, avgTripDistanceMeters: -1 };
    const result = stationStatistics.safeParse(invalidStats);
    expect(result.success).toBe(false);
  });

  it('should reject busiestHour less than 0', () => {
    const invalidStats = { ...validStats, busiestHour: -1 };
    const result = stationStatistics.safeParse(invalidStats);
    expect(result.success).toBe(false);
  });

  it('should reject busiestHour greater than 23', () => {
    const invalidStats = { ...validStats, busiestHour: 24 };
    const result = stationStatistics.safeParse(invalidStats);
    expect(result.success).toBe(false);
  });

  it('should accept busiestHour 0 (midnight)', () => {
    const validStatsWithMidnight = { ...validStats, busiestHour: 0 };
    const result = stationStatistics.safeParse(validStatsWithMidnight);
    expect(result.success).toBe(true);
  });

  it('should accept busiestHour 23 (11 PM)', () => {
    const validStatsWithEvening = { ...validStats, busiestHour: 23 };
    const result = stationStatistics.safeParse(validStatsWithEvening);
    expect(result.success).toBe(true);
  });

  it('should reject busiestDay less than 0', () => {
    const invalidStats = { ...validStats, busiestDay: -1 };
    const result = stationStatistics.safeParse(invalidStats);
    expect(result.success).toBe(false);
  });

  it('should reject busiestDay greater than 6', () => {
    const invalidStats = { ...validStats, busiestDay: 7 };
    const result = stationStatistics.safeParse(invalidStats);
    expect(result.success).toBe(false);
  });

  it('should accept busiestDay 0 (Sunday)', () => {
    const validStatsWithSunday = { ...validStats, busiestDay: 0 };
    const result = stationStatistics.safeParse(validStatsWithSunday);
    expect(result.success).toBe(true);
  });

  it('should accept busiestDay 6 (Saturday)', () => {
    const validStatsWithSaturday = { ...validStats, busiestDay: 6 };
    const result = stationStatistics.safeParse(validStatsWithSaturday);
    expect(result.success).toBe(true);
  });

  it('should reject non-integer values', () => {
    const invalidStats = { ...validStats, totalDepartures: 1523.5 };
    const result = stationStatistics.safeParse(invalidStats);
    expect(result.success).toBe(false);
  });
});

describe('stationDetail', () => {
  const validDetail = {
    stationId: '001',
    name: 'Kaivopuisto',
    location: {
      type: 'Point',
      coordinates: [24.9384, 60.1699],
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    statistics: {
      totalDepartures: 1523,
      totalArrivals: 1489,
      avgTripDurationSeconds: 895,
      avgTripDistanceMeters: 2340,
      busiestHour: 17,
      busiestDay: 2,
    },
  };

  it('should validate valid station detail', () => {
    const result = stationDetail.safeParse(validDetail);
    expect(result.success).toBe(true);
  });

  it('should reject missing statistics', () => {
    const { statistics, ...invalidDetail } = validDetail;
    const result = stationDetail.safeParse(invalidDetail);
    expect(result.success).toBe(false);
  });
});

describe('stationFeature', () => {
  const validFeature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [24.9384, 60.1699],
    },
    properties: {
      stationId: '001',
      name: 'Kaivopuisto',
    },
  };

  it('should validate valid GeoJSON feature', () => {
    const result = stationFeature.safeParse(validFeature);
    expect(result.success).toBe(true);
  });

  it('should reject wrong type', () => {
    const invalidFeature = { ...validFeature, type: 'FeatureCollection' };
    const result = stationFeature.safeParse(invalidFeature);
    expect(result.success).toBe(false);
  });

  it('should reject missing properties', () => {
    const { properties, ...invalidFeature } = validFeature;
    const result = stationFeature.safeParse(invalidFeature);
    expect(result.success).toBe(false);
  });
});

describe('stationFeatureCollection', () => {
  const validCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [24.9384, 60.1699],
        },
        properties: {
          stationId: '001',
          name: 'Kaivopuisto',
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [24.95, 60.18],
        },
        properties: {
          stationId: '002',
          name: 'Hietaniemi',
        },
      },
    ],
  };

  it('should validate valid FeatureCollection', () => {
    const result = stationFeatureCollection.safeParse(validCollection);
    expect(result.success).toBe(true);
  });

  it('should accept empty features array', () => {
    const emptyCollection = { ...validCollection, features: [] };
    const result = stationFeatureCollection.safeParse(emptyCollection);
    expect(result.success).toBe(true);
  });

  it('should reject wrong type', () => {
    const invalidCollection = { ...validCollection, type: 'Feature' };
    const result = stationFeatureCollection.safeParse(invalidCollection);
    expect(result.success).toBe(false);
  });
});

describe('stationsGetQueryParams', () => {
  it('should validate valid bounds and format', () => {
    const validParams = {
      bounds: '24.9,60.15,25.0,60.20',
      format: 'geojson' as const,
    };
    const result = stationsGetQueryParams.safeParse(validParams);
    expect(result.success).toBe(true);
  });

  it('should accept json format', () => {
    const validParams = { format: 'json' as const };
    const result = stationsGetQueryParams.safeParse(validParams);
    expect(result.success).toBe(true);
  });

  it('should default format to geojson', () => {
    const params = {};
    const result = stationsGetQueryParams.parse(params);
    expect(result.format).toBe('geojson');
  });

  it('should accept negative coordinates in bounds', () => {
    const validParams = {
      bounds: '-180,-90,180,90',
      format: 'geojson' as const,
    };
    const result = stationsGetQueryParams.safeParse(validParams);
    expect(result.success).toBe(true);
  });

  it('should accept decimal coordinates in bounds', () => {
    const validParams = {
      bounds: '24.93841,60.16991,25.00000,60.20000',
      format: 'geojson' as const,
    };
    const result = stationsGetQueryParams.safeParse(validParams);
    expect(result.success).toBe(true);
  });

  it('should reject invalid bounds format (missing value)', () => {
    const invalidParams = {
      bounds: '24.9,60.15,25.0',
      format: 'geojson' as const,
    };
    const result = stationsGetQueryParams.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject invalid bounds format (extra value)', () => {
    const invalidParams = {
      bounds: '24.9,60.15,25.0,60.20,extra',
      format: 'geojson' as const,
    };
    const result = stationsGetQueryParams.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject invalid format', () => {
    const invalidParams = { format: 'xml' };
    const result = stationsGetQueryParams.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });
});

describe('stationsGetPathParams', () => {
  it('should validate valid stationId', () => {
    const validParams = { stationId: '001' };
    const result = stationsGetPathParams.safeParse(validParams);
    expect(result.success).toBe(true);
  });

  it('should reject empty stationId', () => {
    const invalidParams = { stationId: '' };
    const result = stationsGetPathParams.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject stationId longer than 50 characters', () => {
    const invalidParams = { stationId: 'a'.repeat(51) };
    const result = stationsGetPathParams.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });
});

describe('stationsListResponseBody', () => {
  it('should validate GeoJSON format response', () => {
    const geoJsonResponse = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [24.9384, 60.1699],
          },
          properties: {
            stationId: '001',
            name: 'Kaivopuisto',
          },
        },
      ],
    };
    const result = stationsListResponseBody.safeParse(geoJsonResponse);
    expect(result.success).toBe(true);
  });

  it('should validate JSON format response', () => {
    const jsonResponse = {
      stations: [
        {
          stationId: '001',
          name: 'Kaivopuisto',
          location: {
            type: 'Point',
            coordinates: [24.9384, 60.1699],
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    };
    const result = stationsListResponseBody.safeParse(jsonResponse);
    expect(result.success).toBe(true);
  });
});

describe('stationsGetResponseBody', () => {
  it('should validate station detail response', () => {
    const response = {
      stationId: '001',
      name: 'Kaivopuisto',
      location: {
        type: 'Point',
        coordinates: [24.9384, 60.1699],
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      statistics: {
        totalDepartures: 1523,
        totalArrivals: 1489,
        avgTripDurationSeconds: 895,
        avgTripDistanceMeters: 2340,
        busiestHour: 17,
        busiestDay: 2,
      },
    };
    const result = stationsGetResponseBody.safeParse(response);
    expect(result.success).toBe(true);
  });
});

describe('tripDirectionStatistics', () => {
  it('should validate correct trip direction statistics', () => {
    const validData = {
      tripsCount: 1523,
      durationSecondsAvg: 895,
      distanceMetersAvg: 2340,
    };
    expect(() => tripDirectionStatistics.parse(validData)).not.toThrow();
  });

  it('should reject negative trip count', () => {
    const invalidData = {
      tripsCount: -1,
      durationSecondsAvg: 895,
      distanceMetersAvg: 2340,
    };
    expect(() => tripDirectionStatistics.parse(invalidData)).toThrow();
  });

  it('should reject non-integer trip count', () => {
    const invalidData = {
      tripsCount: 1523.5,
      durationSecondsAvg: 895,
      distanceMetersAvg: 2340,
    };
    expect(() => tripDirectionStatistics.parse(invalidData)).toThrow();
  });

  it('should accept zero values', () => {
    const validData = {
      tripsCount: 0,
      durationSecondsAvg: 0,
      distanceMetersAvg: 0,
    };
    expect(() => tripDirectionStatistics.parse(validData)).not.toThrow();
  });

  it('should round decimal averages to integers', () => {
    const dataWithDecimals = {
      tripsCount: 100,
      durationSecondsAvg: 895.7,
      distanceMetersAvg: 2340.4,
    };
    const result = tripDirectionStatistics.parse(dataWithDecimals);
    expect(result.durationSecondsAvg).toBe(896);
    expect(result.distanceMetersAvg).toBe(2340);
  });

  it('should require all fields', () => {
    const incompleteData = {
      tripsCount: 1523,
      durationSecondsAvg: 895,
      // Missing distanceMetersAvg
    };
    expect(() => tripDirectionStatistics.parse(incompleteData)).toThrow();
  });
});

describe('stationTripStatistics', () => {
  it('should validate complete station trip statistics', () => {
    const validData = {
      departures: {
        tripsCount: 1523,
        durationSecondsAvg: 895,
        distanceMetersAvg: 2340,
      },
      returns: {
        tripsCount: 1489,
        durationSecondsAvg: 912,
        distanceMetersAvg: 2298,
      },
    };
    expect(() => stationTripStatistics.parse(validData)).not.toThrow();
  });

  it('should require both departures and returns', () => {
    const invalidData = {
      departures: {
        tripsCount: 1523,
        durationSecondsAvg: 895,
        distanceMetersAvg: 2340,
      },
      // Missing returns
    };
    expect(() => stationTripStatistics.parse(invalidData)).toThrow();
  });

  it('should require departures field', () => {
    const invalidData = {
      // Missing departures
      returns: {
        tripsCount: 1489,
        durationSecondsAvg: 912,
        distanceMetersAvg: 2298,
      },
    };
    expect(() => stationTripStatistics.parse(invalidData)).toThrow();
  });

  it('should allow zero values for all statistics', () => {
    const validData = {
      departures: {
        tripsCount: 0,
        durationSecondsAvg: 0,
        distanceMetersAvg: 0,
      },
      returns: {
        tripsCount: 0,
        durationSecondsAvg: 0,
        distanceMetersAvg: 0,
      },
    };
    expect(() => stationTripStatistics.parse(validData)).not.toThrow();
  });
});

describe('stationFeatureProperties', () => {
  it('should validate feature properties with trip statistics', () => {
    const validData = {
      stationId: '001',
      name: 'Kaivopuisto',
      tripStatistics: {
        departures: {
          tripsCount: 1523,
          durationSecondsAvg: 895,
          distanceMetersAvg: 2340,
        },
        returns: {
          tripsCount: 1489,
          durationSecondsAvg: 912,
          distanceMetersAvg: 2298,
        },
      },
    };
    expect(() => stationFeatureProperties.parse(validData)).not.toThrow();
  });

  it('should validate feature properties without trip statistics', () => {
    const validData = {
      stationId: '001',
      name: 'Kaivopuisto',
      // tripStatistics is optional
    };
    expect(() => stationFeatureProperties.parse(validData)).not.toThrow();
  });

  it('should reject if tripStatistics is incomplete', () => {
    const invalidData = {
      stationId: '001',
      name: 'Kaivopuisto',
      tripStatistics: {
        departures: {
          tripsCount: 1523,
          durationSecondsAvg: 895,
          distanceMetersAvg: 2340,
        },
        // Missing returns
      },
    };
    expect(() => stationFeatureProperties.parse(invalidData)).toThrow();
  });

  it('should not have totalDepartures field', () => {
    const data = {
      stationId: '001',
      name: 'Kaivopuisto',
      totalDepartures: 1523, // Old field should not exist
    };
    const result = stationFeatureProperties.parse(data);
    expect(result).not.toHaveProperty('totalDepartures');
  });

  it('should require stationId and name', () => {
    const invalidData = {
      // Missing stationId and name
      tripStatistics: {
        departures: {
          tripsCount: 1523,
          durationSecondsAvg: 895,
          distanceMetersAvg: 2340,
        },
        returns: {
          tripsCount: 1489,
          durationSecondsAvg: 912,
          distanceMetersAvg: 2298,
        },
      },
    };
    expect(() => stationFeatureProperties.parse(invalidData)).toThrow();
  });

  it('should allow undefined tripStatistics', () => {
    const validData = {
      stationId: '001',
      name: 'Kaivopuisto',
      tripStatistics: undefined,
    };
    const result = stationFeatureProperties.parse(validData);
    expect(result.tripStatistics).toBeUndefined();
  });
});

// Type checking tests
describe('TypeScript type inference', () => {
  it('should correctly infer TripDirectionStatistics type', () => {
    const directionStats: TripDirectionStatistics = {
      tripsCount: 1523,
      durationSecondsAvg: 895,
      distanceMetersAvg: 2340,
    };

    // Type assertions to ensure proper typing
    const count: number = directionStats.tripsCount;
    const duration: number = directionStats.durationSecondsAvg;
    const distance: number = directionStats.distanceMetersAvg;

    expect(count).toBe(1523);
    expect(duration).toBe(895);
    expect(distance).toBe(2340);
  });

  it('should correctly infer StationTripStatistics type', () => {
    const stationStats: StationTripStatistics = {
      departures: {
        tripsCount: 1523,
        durationSecondsAvg: 895,
        distanceMetersAvg: 2340,
      },
      returns: {
        tripsCount: 1489,
        durationSecondsAvg: 912,
        distanceMetersAvg: 2298,
      },
    };

    expect(stationStats.departures.tripsCount).toBe(1523);
    expect(stationStats.returns.tripsCount).toBe(1489);
  });

  it('should correctly infer StationFeatureProperties type with optional tripStatistics', () => {
    const featurePropsWithStats: StationFeatureProperties = {
      stationId: '001',
      name: 'Kaivopuisto',
      tripStatistics: {
        departures: {
          tripsCount: 1523,
          durationSecondsAvg: 895,
          distanceMetersAvg: 2340,
        },
        returns: {
          tripsCount: 1489,
          durationSecondsAvg: 912,
          distanceMetersAvg: 2298,
        },
      },
    };

    const featurePropsWithoutStats: StationFeatureProperties = {
      stationId: '001',
      name: 'Kaivopuisto',
    };

    expect(featurePropsWithStats.tripStatistics).toBeDefined();
    expect(featurePropsWithoutStats.tripStatistics).toBeUndefined();
  });
});
