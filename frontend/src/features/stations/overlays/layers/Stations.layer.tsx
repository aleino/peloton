import { Source } from 'react-map-gl/mapbox';
import { useStationsQuery } from '@/features/stations/api';
import { STATIONS_SOURCE_ID } from '@/features/stations/config/layers';
import { StationCirclesLayer } from './StationCircles.layer';
import { StationSymbolsLayer } from './StationSymbols.layer';
import { StationClustersLayer } from './StationClusters.layer';

/**
 * Main stations layer orchestrator
 * Manages data fetching and sub-layer composition
 *
 * Responsibilities:
 * - Fetch station GeoJSON data
 * - Handle loading and error states
 * - Provide data source for sub-layers
 * - Compose circle, symbol, and cluster layers
 *
 * Cluster Properties:
 * - sumDeparturesCount, sumDeparturesDuration, sumDeparturesDistance
 * - sumReturnsCount, sumReturnsDuration, sumReturnsDistance
 * - sumDiffCount, sumDiffDurationAvg, sumDiffDistanceAvg
 *
 * All properties sum metric values across stations in a cluster.
 * To get average per station: divide sum by point_count in the layer expression.
 * Example: ['/', ['get', 'sumDeparturesCount'], ['max', ['get', 'point_count'], 1]]
 *
 * Note: Division must happen in the layer expression, not in clusterProperties,
 * because clusterProperties reduce expressions don't support division operations.
 *
 * @see StationClustersLayer for color calculation using these properties
 */
export const StationsLayer = () => {
  const { data, isLoading, error } = useStationsQuery();

  // Don't render if no data
  if (error || isLoading || !data) {
    return null;
  }

  return (
    <Source
      id={STATIONS_SOURCE_ID}
      type="geojson"
      data={data as unknown as GeoJSON.FeatureCollection}
      cluster={true}
      clusterMaxZoom={14}
      clusterRadius={50}
      clusterProperties={{
        // Departures metrics (sum)
        sumDeparturesCount: ['+', ['coalesce', ['get', 'departuresCount'], 0]],
        sumDeparturesDuration: ['+', ['coalesce', ['get', 'departuresDurationAvg'], 0]],
        sumDeparturesDistance: ['+', ['coalesce', ['get', 'departuresDistanceAvg'], 0]],

        // Returns metrics (sum)
        sumReturnsCount: ['+', ['coalesce', ['get', 'returnsCount'], 0]],
        sumReturnsDuration: ['+', ['coalesce', ['get', 'returnsDurationAvg'], 0]],
        sumReturnsDistance: ['+', ['coalesce', ['get', 'returnsDistanceAvg'], 0]],

        // Difference metrics (sum for map phase, division happens in layer)
        sumDiffCount: ['+', ['coalesce', ['get', 'diffCount'], 0]],
        sumDiffDurationAvg: ['+', ['coalesce', ['get', 'diffDurationAvg'], 0]],
        sumDiffDistanceAvg: ['+', ['coalesce', ['get', 'diffDistanceAvg'], 0]],
      }}
    >
      <StationClustersLayer />
      <StationCirclesLayer />
      <StationSymbolsLayer />
    </Source>
  );
};
