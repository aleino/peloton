import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { location, pointGeometry } from './geospatial.schema.js';
import { distance, duration } from './common.schema.js';

// Extend Zod with OpenAPI capabilities
extendZodWithOpenApi(z);


export const stationId = z.string().min(1).max(50).openapi({
  description: 'Unique station identifier',
  example: '001',
});

export const stationName = z.string().min(1).max(255).openapi({
  description: 'Station name',
  example: 'Kaivopuisto',
});

export const station = z
  .object({
    stationId,
    name: stationName,
    location: location.openapi({
      description: 'Geographic location of the station',
    }),
    createdAt: z.string().datetime().openapi({
      description: 'Timestamp when the station was created (ISO 8601)',
      example: '2024-01-01T00:00:00Z',
    }),
    updatedAt: z.string().datetime().openapi({
      description: 'Timestamp when the station was last updated (ISO 8601)',
      example: '2024-01-01T00:00:00Z',
    }),
    totalDepartures: z.number().int().nonnegative().optional().openapi({
      description: 'Total number of trips departing from this station (for visualization)',
      example: 1523,
    }),
  })
  .openapi('Station');

/**
 * Station statistics
 * Aggregated statistics for a specific station
 */
export const stationStatistics = z
  .object({
    totalDepartures: z.number().int().nonnegative().openapi({
      description: 'Total number of trips departing from this station',
      example: 1523,
    }),
    totalArrivals: z.number().int().nonnegative().openapi({
      description: 'Total number of trips arriving at this station',
      example: 1489,
    }),
    avgTripDurationSeconds: duration.openapi({
      description: 'Average trip duration in seconds (integer)',
      example: 895,
    }),
    avgTripDistanceMeters: distance.openapi({
      description: 'Average trip distance in meters (integer)',
      example: 2340,
    }),
    busiestHour: z.number().int().min(0).max(23).openapi({
      description: 'Hour of day with most activity (0-23)',
      example: 17,
    }),
    busiestDay: z.number().int().min(0).max(6).openapi({
      description: 'Day of week with most activity (0=Sunday, 1=Monday, ..., 6=Saturday)',
      example: 2,
    }),
  })
  .openapi('StationStatistics');

/**
 * Station with statistics (GET /stations/:id response)
 * Detailed view of a station including usage statistics
 */
export const stationDetail = station
  .extend({
    statistics: stationStatistics.openapi({
      description: 'Aggregated usage statistics for this station',
    }),
  })
  .openapi('StationDetail');

/**
 * GeoJSON Feature properties for stations
 * Properties included in a station GeoJSON Feature
 */
export const stationFeatureProperties = z
  .object({
    stationId,
    name: stationName,
    totalDepartures: z.number().int().nonnegative().optional().openapi({
      description: 'Total number of trips departing from this station (for visualization)',
      example: 1523,
    }),
  })
  .openapi('StationFeatureProperties');

/**
 * Single station as GeoJSON Feature
 * Station represented as a GeoJSON Feature with Point geometry
 */
export const stationFeature = z
  .object({
    type: z.literal('Feature').openapi({
      description: 'GeoJSON feature type',
      example: 'Feature',
    }),
    id: z.string().openapi({
      description: 'Feature identifier (same as stationId) for Mapbox feature state',
      example: '001',
    }),
    geometry: pointGeometry.openapi({
      description: 'Point geometry representing station location',
    }),
    properties: stationFeatureProperties.openapi({
      description: 'Station properties',
    }),
  })
  .openapi('StationFeature');

/**
 * Station collection as GeoJSON FeatureCollection
 * Multiple stations represented as a GeoJSON FeatureCollection
 */
export const stationFeatureCollection = z
  .object({
    type: z.literal('FeatureCollection').openapi({
      description: 'GeoJSON feature collection type',
      example: 'FeatureCollection',
    }),
    features: z.array(stationFeature).openapi({
      description: 'Array of station features',
    }),
  })
  .openapi('StationFeatureCollection');

/**
 * Query parameters for GET /stations
 * Filters and options for retrieving stations
 */
export const stationsGetQueryParams = z
  .object({
    bounds: z
      .string()
      .regex(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/)
      .optional()
      .openapi({
        description: 'Bounding box to filter stations: "minLon,minLat,maxLon,maxLat"',
        example: '24.9,60.15,25.0,60.20',
      }),

    format: z.enum(['geojson', 'json']).default('geojson').openapi({
      description: 'Response format: geojson or json',
      example: 'geojson',
    }),
  })
  .openapi('StationsGetQueryParams');

/**
 * Path parameters for GET /stations/:stationId
 * Parameters for retrieving a specific station
 */
export const stationsGetPathParams = z
  .object({
    stationId,
  })
  .openapi('StationsGetPathParams');

/**
 * HTTP Response schemas
 * For GET /stations (collection)
 */
export const stationsListResponseBody = z
  .union([
    stationFeatureCollection, // for format=geojson
    z.object({ stations: z.array(station) }), // for format=json
  ])
  .openapi('StationsListResponseBody');

/**
 * For GET /stations/:id (single resource)
 * Detailed station information with statistics
 */
export const stationsGetResponseBody = stationDetail.openapi('StationsGetResponseBody');

// Export types
export type StationId = z.infer<typeof stationId>;
export type StationName = z.infer<typeof stationName>;
export type Station = z.infer<typeof station>;
export type StationStatistics = z.infer<typeof stationStatistics>;
export type StationDetail = z.infer<typeof stationDetail>;
export type StationFeature = z.infer<typeof stationFeature>;
export type StationFeatureCollection = z.infer<typeof stationFeatureCollection>;
export type StationFeatureProperties = z.infer<typeof stationFeatureProperties>;
export type StationsGetQueryParams = z.infer<typeof stationsGetQueryParams>;
export type StationsGetPathParams = z.infer<typeof stationsGetPathParams>;
export type StationsListResponseBody = z.infer<typeof stationsListResponseBody>;
export type StationsGetResponseBody = z.infer<typeof stationsGetResponseBody>;
