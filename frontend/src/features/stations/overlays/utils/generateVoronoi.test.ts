import { describe, it, expect } from 'vitest';
import { generateVoronoiPolygons, calculateBoundsFromCoordinates } from './generateVoronoi';

describe('generateVoronoiPolygons', () => {
  const bounds: [number, number, number, number] = [24.6, 60.0, 25.3, 60.4];

  it('should return empty FeatureCollection for empty input', () => {
    const result = generateVoronoiPolygons({ type: 'FeatureCollection', features: [] }, { bounds });
    expect(result.features).toHaveLength(0);
  });

  it('should handle single station', () => {
    const stations = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [24.9, 60.2] },
          properties: { id: '001', name: 'Test Station' },
        },
      ],
    };
    const result = generateVoronoiPolygons(stations, { bounds });
    expect(result.features).toHaveLength(1);
    expect(result.features[0]?.geometry.type).toBe('Polygon');
    expect(result.features[0]?.properties.id).toBe('001');
  });

  it('should generate valid Voronoi polygons for multiple stations', () => {
    const stations = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [24.8, 60.1] },
          properties: { id: '001' },
        },
        {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [25.0, 60.2] },
          properties: { id: '002' },
        },
        {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [24.9, 60.3] },
          properties: { id: '003' },
        },
      ],
    };
    const result = generateVoronoiPolygons(stations, { bounds });

    expect(result.features).toHaveLength(3);
    result.features.forEach((feature) => {
      expect(feature.geometry.type).toBe('Polygon');
      expect(feature.geometry.coordinates[0]?.length).toBeGreaterThanOrEqual(4);
    });
  });

  it('should preserve all station properties', () => {
    const stations = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [24.9, 60.2] },
          properties: {
            id: '001',
            name: 'Test Station',
            departuresCount: 100,
            returnsCount: 95,
          },
        },
      ],
    };
    const result = generateVoronoiPolygons(stations, { bounds });
    const firstStation = stations.features[0];

    expect(result.features[0]?.properties).toEqual(firstStation?.properties);
  });

  it('should handle two stations', () => {
    const stations = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [24.8, 60.2] },
          properties: { id: '001' },
        },
        {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [25.0, 60.2] },
          properties: { id: '002' },
        },
      ],
    };
    const result = generateVoronoiPolygons(stations, { bounds });

    expect(result.features).toHaveLength(2);
    expect(result.features[0]?.geometry.type).toBe('Polygon');
    expect(result.features[1]?.geometry.type).toBe('Polygon');
  });
});

describe('calculateBoundsFromCoordinates', () => {
  it('should calculate correct bounds from coordinates', () => {
    const coordinates = [
      [24.6, 60.0],
      [25.3, 60.0],
      [25.3, 60.4],
      [24.6, 60.4],
    ];
    const bounds = calculateBoundsFromCoordinates(coordinates);

    expect(bounds).toEqual([24.6, 60.0, 25.3, 60.4]);
  });

  it('should handle single coordinate', () => {
    const coordinates = [[24.9, 60.2]];
    const bounds = calculateBoundsFromCoordinates(coordinates);

    expect(bounds).toEqual([24.9, 60.2, 24.9, 60.2]);
  });

  it('should handle unordered coordinates', () => {
    const coordinates = [
      [25.0, 60.3],
      [24.7, 60.1],
      [25.2, 60.4],
      [24.6, 60.0],
    ];
    const bounds = calculateBoundsFromCoordinates(coordinates);

    expect(bounds).toEqual([24.6, 60.0, 25.2, 60.4]);
  });
});
