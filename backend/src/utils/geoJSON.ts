import type {
  StationFeature,
  StationFeatureCollection,
  PointGeometry,
  StationTripStatistics,
} from '@peloton/shared';

/**
 * Parse GeoJSON location from database JSON or object
 *
 * The database stores PostGIS geography as JSON, which may be returned
 * as a string or already parsed object depending on the driver configuration.
 *
 * @param location - Database location value (string or object)
 * @returns Parsed PointGeometry with coordinates [longitude, latitude]
 */
export function parseLocation(location: unknown): PointGeometry {
  if (typeof location === 'string') {
    const parsed = JSON.parse(location) as { type: string; coordinates: [number, number] };
    return {
      type: 'Point',
      coordinates: [parsed.coordinates[0], parsed.coordinates[1]],
    };
  }

  const obj = location as { type: string; coordinates: [number, number] };
  return {
    type: 'Point',
    coordinates: [obj.coordinates[0], obj.coordinates[1]],
  };
}
/**
 * Create a GeoJSON Feature for a single station
 *
 * @param stationId - Unique station identifier
 * @param name - Station name
 * @param location - Point geometry with coordinates
 * @param tripStatistics - Optional trip statistics for departures and returns
 * @returns GeoJSON Feature object
 */
export function createStationFeature(
  stationId: string,
  name: string,
  location: PointGeometry,
  tripStatistics?: StationTripStatistics
): StationFeature {
  const feature: StationFeature = {
    type: 'Feature',
    id: stationId,
    geometry: location,
    properties: {
      stationId,
      name,
    },
  };

  if (tripStatistics) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    feature.properties.tripStatistics = tripStatistics;
  }

  return feature;
}
/**
 * Create a GeoJSON FeatureCollection for multiple stations
 *
 * @param features - Array of station features
 * @returns GeoJSON FeatureCollection object
 */
export function createStationsFeatureCollection(
  features: StationFeature[]
): StationFeatureCollection {
  return {
    type: 'FeatureCollection',
    features,
  };
}
