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
  // For diff mode, use departures for now (diff calculation TBD)
  const dir = direction === 'diff' ? 'departures' : direction;

  const propertyMap: Record<Metric, Record<'departures' | 'arrivals', string>> = {
    tripCount: {
      departures: 'departuresCount',
      arrivals: 'returnsCount',
    },
    durationAvg: {
      departures: 'departuresDurationAvg',
      arrivals: 'returnsDurationAvg',
    },
    distanceAvg: {
      departures: 'departuresDistanceAvg',
      arrivals: 'returnsDistanceAvg',
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
 * @param metric - Selected metric (tripCount, durationAvg, distanceAvg)
 * @param direction - Selected direction (departures, arrivals, diff)
 * @returns Cluster property name (e.g., 'sumDeparturesCount')
 */
export function getClusterPropertyName(metric: Metric, direction: Direction): string {
  // For diff mode, use departures for now
  const dir = direction === 'diff' ? 'departures' : direction;

  const propertyMap: Record<Metric, Record<'departures' | 'arrivals', string>> = {
    tripCount: {
      departures: 'sumDeparturesCount',
      arrivals: 'sumReturnsCount',
    },
    durationAvg: {
      departures: 'sumDeparturesDuration',
      arrivals: 'sumReturnsDuration',
    },
    distanceAvg: {
      departures: 'sumDeparturesDistance',
      arrivals: 'sumReturnsDistance',
    },
  };

  return propertyMap[metric][dir];
}
