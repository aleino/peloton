import type { Metric, Direction } from '@/features/map/types';

/**
 * Get the flattened property name for individual station features
 *
 * Maps user-selected metric and direction to the flattened property name
 * in FlattenedStationFeatureProperties.
 *
 * @param metric - Selected metric (tripCount, durationAvg, distanceAvg)
 * @param direction - Selected direction (departures, arrivals, diff)
 * @returns Property name to use in Mapbox expressions
 */
export function getStationPropertyName(metric: Metric, direction: Direction): string {
  // Map direction to internal key ('arrivals' -> 'returns', others pass through)
  const dir = direction === 'arrivals' ? 'returns' : direction;

  // Extended property map including diff direction
  const propertyMap: Record<Metric, Record<'departures' | 'returns' | 'diff', string>> = {
    tripCount: {
      departures: 'departuresCount',
      returns: 'returnsCount',
      diff: 'diffCount',
    },
    durationAvg: {
      departures: 'departuresDurationAvg',
      returns: 'returnsDurationAvg',
      diff: 'diffDurationAvg',
    },
    distanceAvg: {
      departures: 'departuresDistanceAvg',
      returns: 'returnsDistanceAvg',
      diff: 'diffDistanceAvg',
    },
  };

  return propertyMap[metric][dir];
}

/**
 * Get the cluster property name for aggregated values
 *
 * Maps user-selected metric and direction to the cluster sum property name
 * defined in Stations.layer.tsx clusterProperties.
 *
 * Note: All cluster properties use 'sum' prefix because they aggregate values
 * across stations in a cluster. Division by point_count happens in the layer
 * expression to calculate per-station averages.
 *
 * @param metric - Selected metric (tripCount, durationAvg, distanceAvg)
 * @param direction - Selected direction (departures, arrivals, diff)
 * @returns Cluster property name (e.g., 'sumDeparturesCount', 'sumDiffCount')
 */
export function getClusterPropertyName(metric: Metric, direction: Direction): string {
  // Map direction to internal key ('arrivals' -> 'returns', others pass through)
  const dir = direction === 'arrivals' ? 'returns' : direction;

  // Extended property map including diff direction
  const propertyMap: Record<Metric, Record<'departures' | 'returns' | 'diff', string>> = {
    tripCount: {
      departures: 'sumDeparturesCount',
      returns: 'sumReturnsCount',
      diff: 'sumDiffCount',
    },
    durationAvg: {
      departures: 'sumDeparturesDuration',
      returns: 'sumReturnsDuration',
      diff: 'sumDiffDurationAvg',
    },
    distanceAvg: {
      departures: 'sumDeparturesDistance',
      returns: 'sumReturnsDistance',
      diff: 'sumDiffDistanceAvg',
    },
  };

  return propertyMap[metric][dir];
}
