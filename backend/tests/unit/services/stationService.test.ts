import { describe, it, expect, vi } from 'vitest';

import { getStationDetail, getStations } from '../../../src/services/stationService.js';
import * as stationQueries from '../../../src/db/queries/stationQueries.js';

// Mock the database queries
vi.mock('../../../src/db/queries/stationQueries.js');

describe('StationService', () => {
  describe('getStations', () => {
    it('should return GeoJSON format by default', async () => {
      const mockDbStations = [
        {
          stationId: '001',
          name: 'Kaivopuisto',
          location: { type: 'Point' as const, coordinates: [24.9384, 60.1699] as [number, number] },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(stationQueries.getAllStations).mockResolvedValue(mockDbStations);

      const result = await getStations();

      expect(result).toHaveProperty('type', 'FeatureCollection');
      expect(result).toHaveProperty('features');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).features).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).features[0]).toMatchObject({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [24.9384, 60.1699],
        },
        properties: {
          stationId: '001',
          name: 'Kaivopuisto',
        },
      });
    });

    it('should return JSON format when specified', async () => {
      const mockDbStations = [
        {
          stationId: '001',
          name: 'Kaivopuisto',
          location: { type: 'Point' as const, coordinates: [24.9384, 60.1699] as [number, number] },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(stationQueries.getAllStations).mockResolvedValue(mockDbStations);

      const result = await getStations({ format: 'json' });

      expect(result).toHaveProperty('stations');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).stations).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).stations[0]).toMatchObject({
        stationId: '001',
        name: 'Kaivopuisto',
        location: {
          type: 'Point',
          coordinates: [24.9384, 60.1699],
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('should parse and pass bounds to database query', async () => {
      vi.mocked(stationQueries.getAllStations).mockResolvedValue([]);

      await getStations({ bounds: '60.16,24.93,60.17,24.94' });

      expect(stationQueries.getAllStations).toHaveBeenCalledWith({
        minLat: 60.16,
        minLon: 24.93,
        maxLat: 60.17,
        maxLon: 24.94,
      });
    });

    it('should throw error for invalid bounds format', async () => {
      await expect(getStations({ bounds: 'invalid' })).rejects.toThrow(
        'Invalid bounds format. Expected: minLat,minLon,maxLat,maxLon'
      );
    });

    it('should throw error for invalid bounds values (min >= max)', async () => {
      await expect(getStations({ bounds: '60.17,24.94,60.16,24.93' })).rejects.toThrow(
        'Invalid bounds: min values must be less than max values'
      );
    });

    it('should handle empty station list', async () => {
      vi.mocked(stationQueries.getAllStations).mockResolvedValue([]);

      const result = await getStations();

      expect(result).toHaveProperty('type', 'FeatureCollection');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).features).toHaveLength(0);
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
