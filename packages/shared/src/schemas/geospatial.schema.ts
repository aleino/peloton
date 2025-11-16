import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

// Extend Zod with OpenAPI capabilities BEFORE creating any schemas
extendZodWithOpenApi(z);

/**
 * GeoJSON Point geometry
 * Custom implementation compatible with OpenAPI
 */
export const pointGeometry = z
  .object({
    type: z.literal('Point').openapi({
      description: 'Geometry type',
      example: 'Point',
    }),
    coordinates: z
      .tuple([
        z.number().min(-180).max(180), // longitude
        z.number().min(-90).max(90), // latitude
      ])
      .openapi({
        description: 'Coordinates as [longitude, latitude]',
        example: [24.9384, 60.1699],
      }),
  })
  .openapi('PointGeometry', {
    description: 'A GeoJSON Point geometry representing a location',
    example: {
      type: 'Point',
      coordinates: [24.9384, 60.1699], // Helsinki Central Station
    },
  });

/**
 * Simple location type for API responses
 * Validates WGS84 coordinates with proper bounds
 */
export const location = z
  .object({
    type: z.literal('Point').openapi({
      description: 'Geometry type',
      example: 'Point',
    }),
    coordinates: z
      .tuple([
        z.number().min(-180).max(180), // longitude
        z.number().min(-90).max(90), // latitude
      ])
      .openapi({
        description: 'Coordinates as [longitude, latitude]',
        example: [24.9384, 60.1699],
      }),
  })
  .openapi('Location', {
    description:
      'A location with validated WGS84 coordinates (longitude, latitude)',
    example: {
      type: 'Point',
      coordinates: [24.9384, 60.1699],
    },
  });

/**
 * GeoJSON Feature properties (generic object)
 */
export const featureProperties = z
  .record(z.unknown())
  .nullable()
  .openapi('FeatureProperties', {
    description: 'Generic properties object for GeoJSON features',
    example: {
      name: 'Helsinki Central Station',
      type: 'station',
    },
  });

/**
 * Generic GeoJSON Feature
 * Custom implementation compatible with OpenAPI
 */
export const geoJSONFeature = z
  .object({
    type: z.literal('Feature').openapi({
      description: 'GeoJSON feature type',
      example: 'Feature',
    }),
    geometry: pointGeometry.openapi({
      description: 'Point geometry',
    }),
    properties: featureProperties.openapi({
      description: 'Feature properties',
    }),
    id: z.string().or(z.number()).optional().openapi({
      description: 'Optional feature identifier',
      example: 'station-1',
    }),
  })
  .openapi('GeoJsonFeature', {
    description: 'A GeoJSON Feature with Point geometry',
    example: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [24.9384, 60.1699],
      },
      properties: {
        name: 'Helsinki Central Station',
        type: 'station',
      },
      id: 'station-1',
    },
  });

/**
 * Generic GeoJSON FeatureCollection
 * Custom implementation compatible with OpenAPI
 */
export const geoJsonFeatureCollection = z
  .object({
    type: z.literal('FeatureCollection').openapi({
      description: 'GeoJSON feature collection type',
      example: 'FeatureCollection',
    }),
    features: z.array(geoJSONFeature).openapi({
      description: 'Array of features',
    }),
  })
  .openapi('GeoJsonFeatureCollection', {
    description: 'A GeoJSON FeatureCollection containing multiple features',
    example: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [24.9384, 60.1699],
          },
          properties: {
            name: 'Helsinki Central Station',
            type: 'station',
          },
          id: 'station-1',
        },
      ],
    },
  });

// Export types
export type PointGeometry = z.infer<typeof pointGeometry>;
export type Location = z.infer<typeof location>;
export type FeatureProperties = z.infer<typeof featureProperties>;
export type GeoJsonFeature = z.infer<typeof geoJSONFeature>;
export type GeoJsonFeatureCollection = z.infer<typeof geoJsonFeatureCollection>;