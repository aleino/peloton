import { query } from '../../config/database.js';
import type { StationRow, StationStatisticsRow, BoundingBox } from '../types.js';

/**
 * Fetch all stations from the database
 * Optionally filter by bounding box using PostGIS ST_Within
 *
 * @param bounds - Optional bounding box to filter stations
 * @returns Array of station rows
 */
export async function getAllStations(bounds?: BoundingBox): Promise<StationRow[]> {
  let sql: string;
  let params: unknown[];

  if (bounds) {
    // Query with bounding box filter using PostGIS
    sql = `
      SELECT
        station_id,
        name,
        ST_AsGeoJSON(location)::json as location,
        created_at,
        updated_at
      FROM hsl.stations
      WHERE ST_Within(
        location::geometry,
        ST_MakeEnvelope($1, $2, $3, $4, 4326)
      )
      ORDER BY name ASC
    `;
    params = [bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat];
  } else {
    // Query without filter - all stations
    sql = `
      SELECT
        station_id,
        name,
        ST_AsGeoJSON(location)::json as location,
        created_at,
        updated_at
      FROM hsl.stations
      ORDER BY name ASC
    `;
    params = [];
  }

  const result = await query<StationRow>(sql, params);
  return result.rows;
}

export async function getStationById(stationId: string): Promise<StationRow | null> {
  const sql = `
    SELECT
      station_id,
      name,
      ST_AsGeoJSON(location)::json as location,
      created_at,
      updated_at
    FROM hsl.stations
    WHERE station_id = $1
  `;

  const result = await query<StationRow>(sql, [stationId]);
  return result.rows[0] || null;
}

/**
 * Calculate statistics for a specific station
 * Includes total departures/arrivals, average duration, busiest hour and day
 *
 * @param stationId - The station ID to calculate statistics for
 * @returns Statistics row or null if station has no trips
 */
export async function getStationStatistics(
  stationId: string
): Promise<StationStatisticsRow | null> {
  const sql = `
    WITH departure_stats AS (
      SELECT
        COUNT(*) as total_departures,
        AVG(duration_seconds) as avg_duration,
        AVG(distance_meters) as avg_distance,
        MODE() WITHIN GROUP (ORDER BY departure_hour) as busiest_hour_dep,
        MODE() WITHIN GROUP (ORDER BY departure_weekday) as busiest_day_dep
      FROM hsl.trips
      WHERE departure_station_id = $1
    ),
    arrival_stats AS (
      SELECT
        COUNT(*) as total_arrivals
      FROM hsl.trips
      WHERE return_station_id = $1
    )
    SELECT
      $1 as station_id,
      COALESCE(d.total_departures, 0) as total_departures,
      COALESCE(a.total_arrivals, 0) as total_arrivals,
      COALESCE(d.avg_duration, 0) as avg_trip_duration_seconds,
      COALESCE(d.avg_distance, 0) as avg_trip_distance_meters,
      COALESCE(d.busiest_hour_dep, 0) as busiest_hour,
      COALESCE(d.busiest_day_dep, 0) as busiest_day
    FROM departure_stats d
    CROSS JOIN arrival_stats a
  `;

  const result = await query<StationStatisticsRow>(sql, [stationId]);

  // Return null if no data (station has no trips)
  if (result.rows.length === 0 || result.rows[0].totalDepartures === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Verify a station exists (for validation)
 *
 * @param stationId - The station ID to check
 * @returns True if station exists, false otherwise
 */
export async function stationExists(stationId: string): Promise<boolean> {
  const sql = `
    SELECT EXISTS(
      SELECT 1 FROM hsl.stations WHERE station_id = $1
    ) as exists
  `;

  const result = await query<{ exists: boolean }>(sql, [stationId]);
  return result.rows[0].exists;
}
