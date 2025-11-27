import { useEffect } from 'react';
import { Source } from 'react-map-gl/mapbox';
import { useStationsQuery } from '@/features/stations/api';
import { useMapControls, useWaterLayerOrder } from '@/features/map/hooks';
import { STATIONS_SOURCE_ID } from '@/features/stations/config/layers';
import { StationCirclesLayer } from './StationCircles.layer';
import { StationSymbolsLayer } from './StationSymbols.layer';
import { StationClustersLayer } from './StationClusters.layer';
import { StationVoronoiLayer } from './StationVoronoi.layer';

/**
 * Main stations layer orchestrator
 * Manages data fetching and sub-layer composition
 *
 * Responsibilities:
 * - Fetch station GeoJSON data
 * - Handle loading and error states
 * - Provide data source for sub-layers
 * - Compose layers based on visualization mode
 * - Manage water layer ordering for proper z-index
 *
 * Visualization Modes:
 * - 'points': Circle markers with clustering (StationCirclesLayer, StationClustersLayer)
 * - 'voronoi': Voronoi tessellation polygons (StationVoronoiLayer)
 *
 * Water Layer Management:
 * - When switching to Voronoi mode, water layers are moved to top
 * - Voronoi layer renders BELOW water layers using beforeId
 * - When switching back to points mode, original layer order is restored
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
 * Note: Clustering is disabled when using Voronoi visualization because
 * Voronoi diagrams require individual point positions, not cluster centroids.
 *
 * @see StationClustersLayer for color calculation using these properties
 */
export const StationsLayer = () => {
  const { data, isLoading, error } = useStationsQuery();
  const { visualization } = useMapControls();
  const { restoreOriginalOrder } = useWaterLayerOrder();

  // Restore original layer order when switching away from Voronoi
  useEffect(() => {
    if (visualization === 'points') {
      restoreOriginalOrder();
    }
  }, [visualization, restoreOriginalOrder]);

  // Don't render if no data or invalid data
  if (error || isLoading || !data || data.type !== 'FeatureCollection') {
    return null;
  }

  // Determine if clustering should be enabled
  // Clustering is incompatible with Voronoi (need individual points)
  const enableClustering = visualization === 'points';

  return (
    <>
      {/* Main station data source - always rendered */}
      <Source
        id={STATIONS_SOURCE_ID}
        type="geojson"
        data={data as unknown as GeoJSON.FeatureCollection}
        cluster={enableClustering}
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
        {visualization === 'points' && <StationClustersLayer />}
        {visualization === 'points' && <StationCirclesLayer />}
        {visualization === 'points' && <StationSymbolsLayer />}
      </Source>

      {visualization === 'voronoi' && <StationVoronoiLayer />}
    </>
  );
};
