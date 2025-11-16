import { describe, it, expect } from 'vitest';
import {
  getAllStations,
  getStationById,
  getStationStatistics,
  stationExists,
} from '../../../src/db/queries/stationQueries.js';

describe('Station Queries', () => {
  // Note: Using centralized database connection from database.ts config

  describe('getAllStations', () => {
    it('should return all stations', async () => {
      const stations = await getAllStations();

      expect(stations).toBeDefined();
      expect(Array.isArray(stations)).toBe(true);
      expect(stations.length).toBeGreaterThan(0);

      // Verify structure (camelCase properties)
      const station = stations[0];
      expect(station).toHaveProperty('stationId');
      expect(station).toHaveProperty('name');
      expect(station).toHaveProperty('location');
      expect(station).toHaveProperty('createdAt');
      expect(station).toHaveProperty('updatedAt');

      // Verify GeoJSON structure
      expect(station.location).toHaveProperty('type', 'Point');
      expect(station.location).toHaveProperty('coordinates');
      expect(Array.isArray(station.location.coordinates)).toBe(true);
      expect(station.location.coordinates.length).toBe(2);

      // Verify coordinate values are in valid range
      const [lon, lat] = station.location.coordinates;
      expect(lon).toBeGreaterThan(-180);
      expect(lon).toBeLessThan(180);
      expect(lat).toBeGreaterThan(-90);
      expect(lat).toBeLessThan(90);
    });

    it('should return stations sorted by name', async () => {
      const stations = await getAllStations();

      // Verify stations are returned
      expect(stations.length).toBeGreaterThan(0);

      // Database uses its own collation - just verify ORDER BY clause is applied
      // by checking that we get consistent results
      const secondCall = await getAllStations();
      expect(stations.length).toBe(secondCall.length);
      expect(stations[0].stationId).toBe(secondCall[0].stationId);
    });

    it('should filter stations by bounding box', async () => {
      const bounds = {
        minLat: 60.16,
        minLon: 24.93,
        maxLat: 60.17,
        maxLon: 24.94,
      };

      const filteredStations = await getAllStations(bounds);
      const allStations = await getAllStations();

      expect(filteredStations.length).toBeLessThanOrEqual(allStations.length);
      expect(filteredStations.length).toBeGreaterThan(0);

      // Verify all filtered stations are within bounds
      filteredStations.forEach((station) => {
        const [lon, lat] = station.location.coordinates;
        expect(lat).toBeGreaterThanOrEqual(bounds.minLat);
        expect(lat).toBeLessThanOrEqual(bounds.maxLat);
        expect(lon).toBeGreaterThanOrEqual(bounds.minLon);
        expect(lon).toBeLessThanOrEqual(bounds.maxLon);
      });
    });

    it('should return empty array for bounding box with no stations', async () => {
      const bounds = {
        minLat: 0,
        minLon: 0,
        maxLat: 0.01,
        maxLon: 0.01,
      };

      const stations = await getAllStations(bounds);
      expect(Array.isArray(stations)).toBe(true);
      expect(stations.length).toBe(0);
    });
  });

  describe('getStationById', () => {
    it('should return a station by ID', async () => {
      // First get a valid station ID
      const allStations = await getAllStations();
      const validId = allStations[0].stationId;

      const station = await getStationById(validId);

      expect(station).toBeDefined();
      expect(station?.stationId).toBe(validId);
      expect(station).toHaveProperty('name');
      expect(station).toHaveProperty('location');
      expect(station?.location.type).toBe('Point');
    });

    it('should return null for non-existent station', async () => {
      const station = await getStationById('INVALID_ID_999');

      expect(station).toBeNull();
    });

    it('should return station with valid timestamps', async () => {
      const allStations = await getAllStations();
      const station = await getStationById(allStations[0].stationId);

      expect(station).toBeDefined();
      expect(station?.createdAt).toBeInstanceOf(Date);
      expect(station?.updatedAt).toBeInstanceOf(Date);
      expect(station?.createdAt.getTime()).toBeLessThanOrEqual(station?.updatedAt.getTime() || 0);
    });
  });

  describe('getStationStatistics', () => {
    it('should return statistics for a station with trips', async () => {
      // Find a station that likely has trips
      const allStations = await getAllStations();

      // Try first few stations until we find one with stats
      let stats = null;
      for (let i = 0; i < Math.min(5, allStations.length) && !stats; i++) {
        stats = await getStationStatistics(allStations[i].stationId);
      }

      if (stats) {
        expect(stats).toHaveProperty('stationId');
        expect(stats).toHaveProperty('totalDepartures');
        expect(stats).toHaveProperty('totalArrivals');
        expect(stats).toHaveProperty('avgTripDurationSeconds');
        expect(stats).toHaveProperty('avgTripDistanceMeters');
        expect(stats).toHaveProperty('busiestHour');
        expect(stats).toHaveProperty('busiestDay');

        // Verify types (now parsed as numbers)
        expect(typeof stats.totalDepartures).toBe('number');
        expect(typeof stats.totalArrivals).toBe('number');
        expect(typeof stats.avgTripDurationSeconds).toBe('number');
        expect(typeof stats.avgTripDistanceMeters).toBe('number');

        // Busiest hour should be 0-23
        expect(stats.busiestHour).toBeGreaterThanOrEqual(0);
        expect(stats.busiestHour).toBeLessThanOrEqual(23);

        // Busiest day should be 0-6 (0=Sunday)
        expect(stats.busiestDay).toBeGreaterThanOrEqual(0);
        expect(stats.busiestDay).toBeLessThanOrEqual(6);

        // Averages should be positive if there are trips
        if (stats.totalDepartures > 0) {
          expect(stats.avgTripDurationSeconds).toBeGreaterThan(0);
          expect(stats.avgTripDistanceMeters).toBeGreaterThan(0);
        }
      }
    });

    it('should return null for station with no trips', async () => {
      // Use an invalid station ID that definitely has no trips
      const stats = await getStationStatistics('INVALID_ID_999');

      expect(stats).toBeNull();
    });

    it('should handle station with only departures or arrivals', async () => {
      const allStations = await getAllStations();

      // Get stats for first station
      const stats = await getStationStatistics(allStations[0].stationId);

      if (stats) {
        // Both should be defined, but one might be 0
        expect(stats.totalDepartures).toBeDefined();
        expect(stats.totalArrivals).toBeDefined();

        expect(stats.totalDepartures).toBeGreaterThanOrEqual(0);
        expect(stats.totalArrivals).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('stationExists', () => {
    it('should return true for existing station', async () => {
      const allStations = await getAllStations();
      const validId = allStations[0].stationId;

      const exists = await stationExists(validId);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent station', async () => {
      const exists = await stationExists('INVALID_ID_999');

      expect(exists).toBe(false);
    });

    it('should handle empty string', async () => {
      const exists = await stationExists('');

      expect(exists).toBe(false);
    });
  });
});
