import { describe, it, expect, vi } from 'vitest';

import * as stationQueries from '../../../src/db/queries/stationQueries.js';
import { getStationDetail, getStations } from '../../../src/services/stationService.js';

// Mock the database queries
vi.mock('../../../src/db/queries/stationQueries.js');

describe('StationService', () => {
  describe('getStations', () => {
    it('should transform database rows to GeoJSON features with statistics', async () => {
      const mockDbStations = [
        {
          stationId: '001',
          name: 'Kaivopuisto',
          location: { type: 'Point' as const, coordinates: [24.9384, 60.1699] as [number, number] },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          departureTripsCount: 1523,
          departureDurationSecondsAvg: 895,
          departureDistanceMetersAvg: 2340,
          returnTripsCount: 1489,
          returnDurationSecondsAvg: 912,
          returnDistanceMetersAvg: 2298,
        },
      ];

      vi.mocked(stationQueries.getAllStations).mockResolvedValue(mockDbStations);

      const result = await getStations();

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(1);

      const feature = result.features[0];
      expect(feature.properties.tripStatistics).toBeDefined();
      expect(feature.properties.tripStatistics?.departures.tripsCount).toBe(1523);
      expect(feature.properties.tripStatistics?.departures.durationSecondsAvg).toBe(895);
      expect(feature.properties.tripStatistics?.departures.distanceMetersAvg).toBe(2340);
      expect(feature.properties.tripStatistics?.returns.tripsCount).toBe(1489);
      expect(feature.properties.tripStatistics?.returns.durationSecondsAvg).toBe(912);
      expect(feature.properties.tripStatistics?.returns.distanceMetersAvg).toBe(2298);
    });

    it('should return undefined tripStatistics for stations with no trips', async () => {
      const mockDbStations = [
        {
          stationId: '999',
          name: 'Empty Station',
          location: { type: 'Point' as const, coordinates: [24.9502, 60.1672] as [number, number] },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          departureTripsCount: 0,
          departureDurationSecondsAvg: 0,
          departureDistanceMetersAvg: 0,
          returnTripsCount: 0,
          returnDurationSecondsAvg: 0,
          returnDistanceMetersAvg: 0,
        },
      ];

      vi.mocked(stationQueries.getAllStations).mockResolvedValue(mockDbStations);

      const result = await getStations();

      expect(result.features[0].properties.tripStatistics).toBeUndefined();
    });

    it('should include tripStatistics if only departures exist', async () => {
      const mockDbStations = [
        {
          stationId: '002',
          name: 'Station With Only Departures',
          location: { type: 'Point' as const, coordinates: [24.9502, 60.1672] as [number, number] },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          departureTripsCount: 100,
          departureDurationSecondsAvg: 600,
          departureDistanceMetersAvg: 1500,
          returnTripsCount: 0,
          returnDurationSecondsAvg: 0,
          returnDistanceMetersAvg: 0,
        },
      ];

      vi.mocked(stationQueries.getAllStations).mockResolvedValue(mockDbStations);

      const result = await getStations();

      expect(result.features[0].properties.tripStatistics).toBeDefined();
      expect(result.features[0].properties.tripStatistics?.departures.tripsCount).toBe(100);
      expect(result.features[0].properties.tripStatistics?.returns.tripsCount).toBe(0);
    });

    it('should pass bounds to database query', async () => {
      const bounds = {
        minLon: 24.9,
        minLat: 60.15,
        maxLon: 25.0,
        maxLat: 60.2,
      };

      vi.mocked(stationQueries.getAllStations).mockResolvedValue([]);

      await getStations(bounds);

      expect(stationQueries.getAllStations).toHaveBeenCalledWith(bounds);
    });

    it('should not have totalDepartures in feature properties', async () => {
      const mockDbStations = [
        {
          stationId: '001',
          name: 'Kaivopuisto',
          location: { type: 'Point' as const, coordinates: [24.9502, 60.1672] as [number, number] },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          departureTripsCount: 1523,
          departureDurationSecondsAvg: 895,
          departureDistanceMetersAvg: 2340,
          returnTripsCount: 1489,
          returnDurationSecondsAvg: 912,
          returnDistanceMetersAvg: 2298,
        },
      ];

      vi.mocked(stationQueries.getAllStations).mockResolvedValue(mockDbStations);

      const result = await getStations();

      expect(result.features[0].properties).not.toHaveProperty('totalDepartures');
    });

    it('should handle empty station list', async () => {
      vi.mocked(stationQueries.getAllStations).mockResolvedValue([]);

      const result = await getStations();

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(0);
    });
  });

  describe('getStationDetail', () => {
    it('should return station with statistics', async () => {
      const mockStation = {
        stationId: '001',
        name: 'Kaivopuisto',
        location: { type: 'Point' as const, coordinates: [24.9384, 60.1699] as [number, number] },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        departureTripsCount: 0,
        departureDurationSecondsAvg: 0,
        departureDistanceMetersAvg: 0,
        returnTripsCount: 0,
        returnDurationSecondsAvg: 0,
        returnDistanceMetersAvg: 0,
      };

      const mockStats = {
        stationId: '001',
        totalDepartures: 1234,
        totalArrivals: 1156,
        avgTripDurationSeconds: 1200,
        avgTripDistanceMeters: 5500,
        busiestHour: 17,
        busiestDay: 1, // Monday
      };

      vi.mocked(stationQueries.getStationById).mockResolvedValue(mockStation);
      vi.mocked(stationQueries.getStationStatistics).mockResolvedValue(mockStats);

      const result = await getStationDetail('001');

      expect(result).toMatchObject({
        stationId: '001',
        name: 'Kaivopuisto',
        location: {
          type: 'Point',
          coordinates: [24.9384, 60.1699],
        },
        statistics: {
          totalDepartures: 1234,
          totalArrivals: 1156,
          avgTripDurationSeconds: 1200,
          avgTripDistanceMeters: 5500,
          busiestHour: 17,
          busiestDay: 1,
        },
      });
    });

    it('should return null for non-existent station', async () => {
      vi.mocked(stationQueries.getStationById).mockResolvedValue(null);

      const result = await getStationDetail('INVALID');

      expect(result).toBeNull();
    });

    it('should throw error when station exists but has no statistics', async () => {
      const mockStation = {
        stationId: '001',
        name: 'Kaivopuisto',
        location: { type: 'Point' as const, coordinates: [24.9384, 60.1699] as [number, number] },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        departureTripsCount: 0,
        departureDurationSecondsAvg: 0,
        departureDistanceMetersAvg: 0,
        returnTripsCount: 0,
        returnDurationSecondsAvg: 0,
        returnDistanceMetersAvg: 0,
      };

      vi.mocked(stationQueries.getStationById).mockResolvedValue(mockStation);
      vi.mocked(stationQueries.getStationStatistics).mockResolvedValue(null);

      await expect(getStationDetail('001')).rejects.toThrow(
        'Station 001 exists but has no trip statistics'
      );
    });

    it('should handle dates correctly in ISO format', async () => {
      const testDate = new Date('2024-06-15T12:30:45.123Z');
      const mockStation = {
        stationId: '002',
        name: 'Test Station',
        location: { type: 'Point' as const, coordinates: [25.0, 60.2] as [number, number] },
        createdAt: testDate,
        updatedAt: testDate,
        departureTripsCount: 0,
        departureDurationSecondsAvg: 0,
        departureDistanceMetersAvg: 0,
        returnTripsCount: 0,
        returnDurationSecondsAvg: 0,
        returnDistanceMetersAvg: 0,
      };

      const mockStats = {
        stationId: '002',
        totalDepartures: 100,
        totalArrivals: 95,
        avgTripDurationSeconds: 600,
        avgTripDistanceMeters: 3000,
        busiestHour: 8,
        busiestDay: 4,
      };

      vi.mocked(stationQueries.getStationById).mockResolvedValue(mockStation);
      vi.mocked(stationQueries.getStationStatistics).mockResolvedValue(mockStats);

      const result = await getStationDetail('002');

      expect(result?.createdAt).toBe('2024-06-15T12:30:45.123Z');
      expect(result?.updatedAt).toBe('2024-06-15T12:30:45.123Z');
    });
  });
});
