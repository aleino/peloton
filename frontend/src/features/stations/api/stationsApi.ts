import { get } from '@/services/api';
import type { StationsListResponseBody, StationsGetResponseBody } from '@peloton/shared';

/**
 * Parameters for fetching stations list
 */
interface FetchStationsParams {
  bounds?: string;
  format?: 'geojson' | 'json';
}

/**
 * Fetch all stations from API
 * Returns GeoJSON FeatureCollection by default
 *
 * @param params - Query parameters for filtering stations
 * @returns Promise resolving to stations list response
 *
 * @example
 * ```typescript
 * // Fetch all stations as GeoJSON
 * const stations = await fetchStations();
 *
 * // Fetch stations within bounds
 * const filtered = await fetchStations({
 *   bounds: '24.9,60.15,25.0,60.20'
 * });
 * ```
 */
export async function fetchStations(
  params: FetchStationsParams = {}
): Promise<StationsListResponseBody> {
  const { bounds, format = 'geojson' } = params;

  return get<StationsListResponseBody>('/stations', {
    params: { ...(bounds && { bounds }), format },
  });
}

/**
 * Fetch detailed station information by ID
 * Includes aggregated statistics
 *
 * @param stationId - Unique station identifier
 * @returns Promise resolving to detailed station information
 *
 * @example
 * ```typescript
 * const station = await fetchStationDetail('001');
 * console.log(station.statistics.totalDepartures);
 * ```
 */
export async function fetchStationDetail(stationId: string): Promise<StationsGetResponseBody> {
  return get<StationsGetResponseBody>(`/stations/${stationId}`);
}
