import type {
  StationDetail,
  StationStatistics,
  StationFeatureCollection,
  StationTripStatistics,
  Station,
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
 * Get all stations as GeoJSON FeatureCollection with trip statistics
 *
 * Fetches stations from database with aggregated trip statistics and transforms
 * to GeoJSON format. Database automatically returns camelCase column names.
 *
 * @param bounds - Optional bounding box (already parsed by route middleware)
 * @returns Stations as GeoJSON FeatureCollection with optional trip statistics
 */
export async function getStations(bounds?: BoundingBox): Promise<StationFeatureCollection> {
  // Fetch from database (returns camelCase automatically)
  const dbStations = await dbGetAllStations(bounds);

  // Transform to GeoJSON features
  const features = dbStations.map((row) => {
    const location = parseLocation(row.location);

    // Build trip statistics if station has trips
    const tripStatistics: StationTripStatistics | undefined =
      row.departureTripsCount > 0 || row.returnTripsCount > 0
        ? {
            departures: {
              tripsCount: row.departureTripsCount,
              durationSecondsAvg: row.departureDurationSecondsAvg,
              distanceMetersAvg: row.departureDistanceMetersAvg,
            },
            returns: {
              tripsCount: row.returnTripsCount,
              durationSecondsAvg: row.returnDurationSecondsAvg,
              distanceMetersAvg: row.returnDistanceMetersAvg,
            },
          }
        : undefined;

    return createStationFeature(row.stationId, row.name, location, tripStatistics);
  });

  return createStationsFeatureCollection(features);
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
export async function getStationDetail(stationId: string): Promise<StationDetail | null> {
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
