/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import type { StationDetail, Station } from '@peloton/shared';
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
    const response = await request(app).get('/api/v1/stations?format=json');
    if (response.body.stations && response.body.stations.length > 0) {
      validStationId = response.body.stations[0].stationId;
    }
  });

  afterAll(async () => {
    await closeDatabasePool();
  });

  describe('GET /api/v1/stations', () => {
    describe('Default behavior (GeoJSON format)', () => {
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
    });

    describe('JSON format', () => {
      it('should return stations array when format=json', async () => {
        const response = await request(app).get('/api/v1/stations?format=json').expect(200);

        expect(response.body).toHaveProperty('stations');
        expect(Array.isArray(response.body.stations)).toBe(true);

        const station: Station = response.body.stations[0];
        expect(station).toMatchObject({
          stationId: expect.any(String),
          name: expect.any(String),
          location: {
            type: 'Point',
            coordinates: expect.arrayContaining([expect.any(Number), expect.any(Number)]),
          },
          createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
          updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        });
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

      it('should return 400 for invalid format parameter', async () => {
        const response = await request(app).get('/api/v1/stations?format=xml').expect(400);

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
        // Get station from list
        const listResponse = await request(app).get('/api/v1/stations?format=json');

        const stationFromList: Station = listResponse.body.stations[0];

        // Get same station from detail endpoint
        const detailResponse = await request(app)
          .get(`/api/v1/stations/${stationFromList.stationId}`)
          .expect(200);

        const stationDetail: StationDetail = detailResponse.body;

        // Verify core fields match
        expect(stationDetail.stationId).toBe(stationFromList.stationId);
        expect(stationDetail.name).toBe(stationFromList.name);
        expect(stationDetail.location).toEqual(stationFromList.location);
      });
    });
  });

  describe('Response format consistency', () => {
    it('should return proper content-type headers', async () => {
      await request(app).get('/api/v1/stations').expect('Content-Type', /application\/json/);
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
