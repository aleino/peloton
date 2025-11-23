import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchStations, fetchStationDetail } from './stationsApi';
import * as api from '@/services/api';
import type { StationsListResponseBody, StationsGetResponseBody } from '@peloton/shared';

// Mock the API client
vi.mock('@/services/api', () => ({
  get: vi.fn(),
}));

describe('stationsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('fetchStations', () => {
    const mockGeoJSONResponse: StationsListResponseBody = {
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
            name: 'Test Station 1',
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
            name: 'Test Station 2',
          },
        },
      ],
    };

    it('should fetch all stations as GeoJSON', async () => {
      vi.mocked(api.get).mockResolvedValue(mockGeoJSONResponse);

      const result = await fetchStations();

      expect(api.get).toHaveBeenCalledWith('/stations', {
        params: {},
      });
      expect(result).toEqual(mockGeoJSONResponse);
    });

    it('should fetch stations with bounds parameter', async () => {
      const bounds = '24.9,60.15,25.0,60.20';
      vi.mocked(api.get).mockResolvedValue(mockGeoJSONResponse);

      const result = await fetchStations({ bounds });

      expect(api.get).toHaveBeenCalledWith('/stations', {
        params: { bounds },
      });
      expect(result).toEqual(mockGeoJSONResponse);
    });

    it('should handle 404 error', async () => {
      const error = new Error('Not Found');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(fetchStations()).rejects.toThrow('Not Found');
    });

    it('should handle network failure', async () => {
      const networkError = new Error('Network Error');
      vi.mocked(api.get).mockRejectedValue(networkError);

      await expect(fetchStations()).rejects.toThrow('Network Error');
    });
  });

  describe('fetchStationDetail', () => {
    const mockStationDetail: StationsGetResponseBody = {
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

    it('should fetch station detail with valid stationId', async () => {
      vi.mocked(api.get).mockResolvedValue(mockStationDetail);

      const result = await fetchStationDetail('001');

      expect(api.get).toHaveBeenCalledWith('/stations/001');
      expect(result).toEqual(mockStationDetail);
    });

    it('should handle 404 error for non-existent station', async () => {
      const error = new Error('Station not found');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(fetchStationDetail('999')).rejects.toThrow('Station not found');
    });

    it('should handle network failure', async () => {
      const networkError = new Error('Network Error');
      vi.mocked(api.get).mockRejectedValue(networkError);

      await expect(fetchStationDetail('001')).rejects.toThrow('Network Error');
    });

    it('should handle empty stationId', async () => {
      vi.mocked(api.get).mockResolvedValue(mockStationDetail);

      await fetchStationDetail('');

      expect(api.get).toHaveBeenCalledWith('/stations/');
    });
  });
});
