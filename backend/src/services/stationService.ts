import type {
  Station,
  StationDetail,
  StationStatistics,
  StationsListResponseBody,
} from '@peloton/shared';
import { stationStatistics } from '@peloton/shared';

import {
  getAllStations as dbGetAllStations,
  getStationById as dbGetStationById,
  getStationStatistics as dbGetStationStatistics,
} from '../db/queries/stationQueries.js';
import type { BoundingBox } from '../db/types.js';
import {
  parseLocation,
  createStationFeature,
  createStationsFeatureCollection,
} from '../utils/geoJSON.js';

/**
 * Parse bounds string to BoundingBox object
 * Format: "minLat,minLon,maxLat,maxLon"
 * 
 * @param boundsStr - Comma-separated bounds string
 * @returns Parsed bounding box object
 * @throws Error if bounds format is invalid
 */
function parseBounds(boundsStr: string): BoundingBox {
  const [minLat, minLon, maxLat, maxLon] = boundsStr.split(',').map(Number);

  if ([minLat, minLon, maxLat, maxLon].some(isNaN)) {
    throw new Error('Invalid bounds format. Expected: minLat,minLon,maxLat,maxLon');
  }

  if (minLat >= maxLat || minLon >= maxLon) {
    throw new Error('Invalid bounds: min values must be less than max values');
  }

  return { minLat, minLon, maxLat, maxLon };
}

/**
 * Get all stations in the specified format
 * 
 * Fetches stations from database and transforms to either GeoJSON or JSON format.
 * Database automatically returns camelCase column names.
 * 
 * @param options - Query options (bounds filter, format)
 * @returns Stations in requested format (GeoJSON FeatureCollection or JSON array)
 */
export async function getStations(
  options: {
    bounds?: string;
    format?: 'geojson' | 'json';
  } = {}
): Promise<StationsListResponseBody> {
  const { bounds: boundsStr, format = 'geojson' } = options;

  // Parse bounds if provided
  const bounds = boundsStr ? parseBounds(boundsStr) : undefined;

  // Fetch from database (returns camelCase automatically)
  const dbStations = await dbGetAllStations(bounds);

  // Transform to GeoJSON format
  if (format === 'geojson') {
    const features = dbStations.map((row) => {
      const location = parseLocation(row.location);
      return createStationFeature(row.stationId, row.name, location, row.totalDepartures);
    });

    return createStationsFeatureCollection(features);
  }

  // Transform to JSON format
  const stations: Station[] = dbStations.map((row) => ({
    stationId: row.stationId,
    name: row.name,
    location: parseLocation(row.location),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    totalDepartures: row.totalDepartures,
  }));

  return { stations };
}

/**
 * Get station by ID with statistics
 * 
 * Fetches detailed station information including aggregated trip statistics.
 * Returns null if station doesn't exist, throws error if station exists but has no trips.
 * 
 * @param stationId - Unique station identifier
 * @returns Station detail with statistics, or null if not found
 * @throws Error if station exists but has no trip statistics
 */
export async function getStationDetail(
  stationId: string
): Promise<StationDetail | null> {
  // Fetch station data
  const stationRow = await dbGetStationById(stationId);

  if (!stationRow) {
    return null;
  }

  // Fetch statistics
  const statsRow = await dbGetStationStatistics(stationId);

  if (!statsRow) {
    throw new Error(`Station ${stationId} exists but has no trip statistics`);
  }

  // Build response (database already returns camelCase)
  const station: Station = {
    stationId: stationRow.stationId,
    name: stationRow.name,
    location: parseLocation(stationRow.location),
    createdAt: stationRow.createdAt.toISOString(),
    updatedAt: stationRow.updatedAt.toISOString(),
  };

  // Parse statistics through Zod schema to apply transformations (rounding)
  const statistics: StationStatistics = stationStatistics.parse({
    totalDepartures: statsRow.totalDepartures,
    totalArrivals: statsRow.totalArrivals,
    avgTripDurationSeconds: statsRow.avgTripDurationSeconds,
    avgTripDistanceMeters: statsRow.avgTripDistanceMeters,
    busiestHour: statsRow.busiestHour,
    busiestDay: statsRow.busiestDay,
  });

  return {
    ...station,
    statistics,
  };
}

/**
 * Check if a station exists
 * 
 * @param stationId - Station identifier to check
 * @returns True if station exists, false otherwise
 */
export async function checkStationExists(stationId: string): Promise<boolean> {
  const station = await dbGetStationById(stationId);
  return station !== null;
}
