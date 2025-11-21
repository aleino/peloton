import { describe, it, expect } from 'vitest';

import {
  parseLocation,
  createStationFeature,
  createStationsFeatureCollection,
} from '../../../src/utils/geoJSON.js';

describe('GeoJSON Utils', () => {
  describe('parseLocation', () => {
    it('should parse JSON string location', () => {
      const jsonString = '{"type":"Point","coordinates":[24.9384,60.1699]}';
      const result = parseLocation(jsonString);

      expect(result).toEqual({
        type: 'Point',
        coordinates: [24.9384, 60.1699],
      });
    });

    it('should handle object location', () => {
      const obj = { type: 'Point', coordinates: [24.9384, 60.1699] };
      const result = parseLocation(obj);

      expect(result).toEqual({
        type: 'Point',
        coordinates: [24.9384, 60.1699],
      });
    });

    it('should handle location with exact coordinate values', () => {
      const obj = { type: 'Point', coordinates: [25.0, 60.0] };
      const result = parseLocation(obj);

      expect(result).toEqual({
        type: 'Point',
        coordinates: [25.0, 60.0],
      });
    });
  });

  describe('createStationFeature', () => {
    it('should create valid GeoJSON feature', () => {
      const location = {
        type: 'Point' as const,
        coordinates: [24.9384, 60.1699] as [number, number],
      };
      const feature = createStationFeature('001', 'Kaivopuisto', location);

      expect(feature).toEqual({
        type: 'Feature',
        id: '001',
        geometry: location,
        properties: {
          stationId: '001',
          name: 'Kaivopuisto',
        },
      });
    });

    it('should create feature with different station data', () => {
      const location = {
        type: 'Point' as const,
        coordinates: [24.9414, 60.1699] as [number, number],
      };
      const feature = createStationFeature('002', 'Laivasillankatu', location);

      expect(feature).toEqual({
        type: 'Feature',
        id: '002',
        geometry: location,
        properties: {
          stationId: '002',
          name: 'Laivasillankatu',
        },
      });
    });

    it('should include id field matching stationId', () => {
      const location = {
        type: 'Point' as const,
        coordinates: [24.9, 60.1] as [number, number],
      };
      const feature = createStationFeature('001', 'Test Station', location, 1523);

      expect(feature.id).toBe('001');
      expect(feature.properties.stationId).toBe('001');
      expect(feature.id).toBe(feature.properties.stationId);
    });

    it('should include totalDepartures when provided', () => {
      const location = {
        type: 'Point' as const,
        coordinates: [24.9, 60.1] as [number, number],
      };
      const feature = createStationFeature('001', 'Test Station', location, 1523);

      expect(feature.properties.totalDepartures).toBe(1523);
      expect(feature.id).toBe('001');
    });
  });

  describe('createStationsFeatureCollection', () => {
    it('should create empty feature collection', () => {
      const collection = createStationsFeatureCollection([]);

      expect(collection).toEqual({
        type: 'FeatureCollection',
        features: [],
      });
    });

    it('should create feature collection with single feature', () => {
      const location = {
        type: 'Point' as const,
        coordinates: [24.9384, 60.1699] as [number, number],
      };
      const feature = createStationFeature('001', 'Kaivopuisto', location);
      const collection = createStationsFeatureCollection([feature]);

      expect(collection).toEqual({
        type: 'FeatureCollection',
        features: [feature],
      });
    });

    it('should create feature collection with multiple features', () => {
      const location1 = {
        type: 'Point' as const,
        coordinates: [24.9384, 60.1699] as [number, number],
      };
      const location2 = {
        type: 'Point' as const,
        coordinates: [24.9414, 60.1699] as [number, number],
      };

      const feature1 = createStationFeature('001', 'Kaivopuisto', location1);
      const feature2 = createStationFeature('002', 'Laivasillankatu', location2);

      const collection = createStationsFeatureCollection([feature1, feature2]);

      expect(collection).toEqual({
        type: 'FeatureCollection',
        features: [feature1, feature2],
      });
      expect(collection.features).toHaveLength(2);
    });
  });
});
