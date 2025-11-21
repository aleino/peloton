import type { Pool, QueryResult } from 'pg';

/**
 * Database row types in camelCase
 * Note: The database.ts query() function automatically converts snake_case to camelCase
 */

export interface StationRow {
  stationId: string;
  name: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  createdAt: Date;
  updatedAt: Date;
  totalDepartures?: number; // Optional for backward compatibility
}

export interface StationStatisticsRow {
  stationId: string;
  totalDepartures: number; // bigint from COUNT, parsed as number
  totalArrivals: number;
  avgTripDurationSeconds: number; // numeric, parsed as number
  avgTripDistanceMeters: number; // numeric, parsed as number
  busiestHour: number;
  busiestDay: number; // 0=Sunday, 1=Monday, etc.
}

/**
 * Helper type for query parameters
 */
export interface BoundingBox {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

export type DbPool = Pool;
export type DbQueryResult<T extends Record<string, unknown>> = QueryResult<T>;
