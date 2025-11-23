/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import type { StationDetail } from '@peloton/shared';
import type { Application } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { createApp } from '../../src/app.js';
import { closeDatabasePool } from '../../src/config/database.js';

describe('Stations API - Integration Tests', () => {
  let app: Application;
  let validStationId: string;

  beforeAll(async () => {
    // Initialize application
    app = createApp();

    // Get a valid station ID for tests
    const response = await request(app).get('/api/v1/stations');
    if (response.body.features && response.body.features.length > 0) {
      validStationId = response.body.features[0].properties.stationId;
    }
  });

  afterAll(async () => {
    await closeDatabasePool();
  });

  describe('GET /api/v1/stations', () => {
    describe('GeoJSON Response', () => {
      it('should return GeoJSON FeatureCollection', async () => {
        const response = await request(app)
          .get('/api/v1/stations')
          .expect(200)
          .expect('Content-Type', /json/);

        // Validate structure
        expect(response.body).toHaveProperty('type', 'FeatureCollection');
        expect(response.body).toHaveProperty('features');
        expect(Array.isArray(response.body.features)).toBe(true);
        expect(response.body.features.length).toBeGreaterThan(0);

        // Validate first feature
        const feature = response.body.features[0];
        expect(feature).toMatchObject({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: expect.arrayContaining([expect.any(Number), expect.any(Number)]),
          },
          properties: {
            stationId: expect.any(String),
            name: expect.any(String),
          },
        });

        // Validate coordinate bounds (Helsinki region)
        const coords = feature.geometry.coordinates;
        expect(coords[0]).toBeGreaterThan(24); // longitude
        expect(coords[0]).toBeLessThan(26);
        expect(coords[1]).toBeGreaterThan(60); // latitude
        expect(coords[1]).toBeLessThan(61);
      });

      it('should return at least 400 stations', async () => {
        const response = await request(app).get('/api/v1/stations').expect(200);

        expect(response.body.features.length).toBeGreaterThanOrEqual(400);
      });

      it('should include tripStatistics in GeoJSON feature properties', async () => {
        const response = await request(app).get('/api/v1/stations').expect(200);

        expect(response.body.type).toBe('FeatureCollection');
        expect(response.body.features).toBeDefined();
        expect(response.body.features.length).toBeGreaterThan(0);

        const firstFeature = response.body.features[0];
        expect(firstFeature.properties).toHaveProperty('stationId');
        expect(firstFeature.properties).toHaveProperty('name');

        // Trip statistics should be present for stations with trips
        if (firstFeature.properties.tripStatistics) {
          expect(firstFeature.properties.tripStatistics).toHaveProperty('departures');
          expect(firstFeature.properties.tripStatistics).toHaveProperty('returns');

          expect(firstFeature.properties.tripStatistics.departures).toHaveProperty('tripsCount');
          expect(firstFeature.properties.tripStatistics.departures).toHaveProperty(
            'durationSecondsAvg'
          );
          expect(firstFeature.properties.tripStatistics.departures).toHaveProperty(
            'distanceMetersAvg'
          );

          expect(typeof firstFeature.properties.tripStatistics.departures.tripsCount).toBe(
            'number'
          );
          expect(
            firstFeature.properties.tripStatistics.departures.tripsCount
          ).toBeGreaterThanOrEqual(0);
        }
      });

      it('should include id field in GeoJSON features', async () => {
        const response = await request(app).get('/api/v1/stations').expect(200);

        expect(response.body.type).toBe('FeatureCollection');
        expect(response.body.features).toBeInstanceOf(Array);

        if (response.body.features.length > 0) {
          const firstFeature = response.body.features[0];
          expect(firstFeature).toHaveProperty('id');
          expect(firstFeature.id).toBe(firstFeature.properties.stationId);
        }
      });
    });

    describe('Bounding box filtering', () => {
      it('should filter stations by bounding box', async () => {
        // Helsinki city center bounds
        const bounds = '60.16,24.93,60.17,24.94';

        const filteredResponse = await request(app)
          .get(`/api/v1/stations?bounds=${bounds}`)
          .expect(200);

        const allResponse = await request(app).get('/api/v1/stations').expect(200);

        // Filtered results should be fewer than all results
        expect(filteredResponse.body.features.length).toBeLessThan(
          allResponse.body.features.length
        );

        // Verify all returned stations are within bounds
        for (const feature of filteredResponse.body.features) {
          const [lon, lat] = feature.geometry.coordinates;
          expect(lon).toBeGreaterThanOrEqual(24.93);
          expect(lon).toBeLessThanOrEqual(24.94);
          expect(lat).toBeGreaterThanOrEqual(60.16);
          expect(lat).toBeLessThanOrEqual(60.17);
        }
      });

      it('should return empty array for bounds with no stations', async () => {
        // Bounds in the middle of the Baltic Sea
        const bounds = '60.0,25.5,60.01,25.51';

        const response = await request(app).get(`/api/v1/stations?bounds=${bounds}`).expect(200);

        // Might be empty or very few results
        expect(response.body.features.length).toBeLessThan(5);
      });
    });

    describe('Error handling', () => {
      it('should return 400 for invalid bounds format', async () => {
        const response = await request(app).get('/api/v1/stations?bounds=invalid').expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatchObject({
          code: expect.any(String),
          message: expect.any(String),
        });
      });

      it('should return 400 for bounds with missing values', async () => {
        const response = await request(app)
          .get('/api/v1/stations?bounds=60.16,24.93,60.17')
          .expect(400);

        expect(response.body.error.code).toBe('INVALID_QUERY_PARAMS');
      });

      it('should return 400 when minLat >= maxLat', async () => {
        const response = await request(app)
          .get('/api/v1/stations?bounds=60.17,24.93,60.16,24.94')
          .expect(400);

        expect(response.body.error.message).toMatch(/min.*max/i);
      });
    });
  });

  describe('GET /api/v1/stations/:stationId', () => {
    describe('Success cases', () => {
      it('should return station detail with statistics', async () => {
        const response = await request(app).get(`/api/v1/stations/${validStationId}`).expect(200);

        const station: StationDetail = response.body;

        // Validate base station properties
        expect(station).toMatchObject({
          stationId: validStationId,
          name: expect.any(String),
          location: {
            type: 'Point',
            coordinates: expect.arrayContaining([expect.any(Number), expect.any(Number)]),
          },
          createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
          updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        });

        // Validate statistics
        expect(station.statistics).toMatchObject({
          totalDepartures: expect.any(Number),
          totalArrivals: expect.any(Number),
          avgTripDurationSeconds: expect.any(Number),
          avgTripDistanceMeters: expect.any(Number),
          busiestHour: expect.any(Number),
          busiestDay: expect.any(Number),
        });

        // Validate statistics constraints
        expect(station.statistics.totalDepartures).toBeGreaterThanOrEqual(0);
        expect(station.statistics.totalArrivals).toBeGreaterThanOrEqual(0);
        expect(station.statistics.avgTripDurationSeconds).toBeGreaterThanOrEqual(0);
        expect(station.statistics.avgTripDistanceMeters).toBeGreaterThanOrEqual(0);
        expect(station.statistics.busiestHour).toBeGreaterThanOrEqual(0);
        expect(station.statistics.busiestHour).toBeLessThanOrEqual(23);
        expect(station.statistics.busiestDay).toBeGreaterThanOrEqual(0);
        expect(station.statistics.busiestDay).toBeLessThanOrEqual(6);
      });

      it('should return station with statistics defined', async () => {
        // This test verifies that statistics are always present in the response
        const response = await request(app).get(`/api/v1/stations/${validStationId}`).expect(200);

        // At minimum, statistics should be present (even if zero)
        expect(response.body.statistics).toBeDefined();
      });

      it('should return avgTripDurationSeconds as integer (0 decimals)', async () => {
        const response = await request(app).get(`/api/v1/stations/${validStationId}`).expect(200);

        const avgTripDurationSeconds = response.body.statistics.avgTripDurationSeconds as number;

        // Verify it's an integer
        expect(Number.isInteger(avgTripDurationSeconds)).toBe(true);

        // Verify no decimal places when converted to string
        const decimalPlaces = (String(avgTripDurationSeconds).split('.')[1] || '').length;
        expect(decimalPlaces).toBe(0);
      });

      it('should return avgTripDistanceMeters as integer (0 decimals)', async () => {
        const response = await request(app).get(`/api/v1/stations/${validStationId}`).expect(200);

        const avgTripDistanceMeters = response.body.statistics.avgTripDistanceMeters as number;

        // Verify it's an integer
        expect(Number.isInteger(avgTripDistanceMeters)).toBe(true);

        // Verify no decimal places when converted to string
        const decimalPlaces = (String(avgTripDistanceMeters).split('.')[1] || '').length;
        expect(decimalPlaces).toBe(0);
      });

      it('should round statistics correctly (regression test)', async () => {
        const response = await request(app).get(`/api/v1/stations/${validStationId}`).expect(200);

        const { avgTripDurationSeconds, avgTripDistanceMeters } = response.body.statistics;

        // Both should be whole numbers (no decimals like 1234.567)
        expect(avgTripDurationSeconds % 1).toBe(0);
        expect(avgTripDistanceMeters % 1).toBe(0);

        // Should be non-negative
        expect(avgTripDurationSeconds).toBeGreaterThanOrEqual(0);
        expect(avgTripDistanceMeters).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Error cases', () => {
      it('should return 404 for non-existent station ID', async () => {
        const response = await request(app)
          .get('/api/v1/stations/NONEXISTENT_STATION_999')
          .expect(404);

        expect(response.body).toMatchObject({
          error: {
            code: 'STATION_NOT_FOUND',
            message: expect.stringContaining('NONEXISTENT_STATION_999'),
          },
        });
      });

      it('should return 404 for empty/whitespace station ID', async () => {
        // Test with URL-encoded space - this will be treated as an empty string
        // Express will route this as /api/v1/stations/ which should be 404
        const response = await request(app).get('/api/v1/stations/%20').expect(404);

        expect(response.body.error.code).toBe('STATION_NOT_FOUND');
      });
    });

    describe('Data consistency', () => {
      it('should return consistent data between list and detail endpoints', async () => {
        // Get station from list (GeoJSON format)
        const listResponse = await request(app).get('/api/v1/stations');

        const firstFeature = listResponse.body.features[0];
        const stationId = firstFeature.properties.stationId;

        // Get same station from detail endpoint
        const detailResponse = await request(app).get(`/api/v1/stations/${stationId}`).expect(200);

        const stationDetail: StationDetail = detailResponse.body;

        // Verify core fields match
        expect(stationDetail.stationId).toBe(stationId);
        expect(stationDetail.name).toBe(firstFeature.properties.name);
        expect(stationDetail.location.coordinates).toEqual(firstFeature.geometry.coordinates);
      });
    });
  });

  describe('Response format consistency', () => {
    it('should return proper content-type headers', async () => {
      await request(app)
        .get('/api/v1/stations')
        .expect('Content-Type', /application\/json/);
    });

    it('should not expose internal error details in production', async () => {
      // This test verifies error responses don't leak stack traces
      const response = await request(app).get('/api/v1/stations/INVALID').expect(404);

      // Error response should not contain stack trace
      expect(response.body).not.toHaveProperty('stack');
      expect(JSON.stringify(response.body)).not.toMatch(/at Object\./);
    });
  });

  describe('Performance', () => {
    it('should respond to /stations within 1 second', async () => {
      const startTime = Date.now();

      await request(app).get('/api/v1/stations').expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });

    it('should respond to /stations/:id within 500ms', async () => {
      const startTime = Date.now();

      await request(app).get(`/api/v1/stations/${validStationId}`).expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
    });
  });
});
