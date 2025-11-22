import { Source } from 'react-map-gl/mapbox';
import { useStationsQuery } from '@/features/stations/api';
import type { StationFeatureCollection } from '@peloton/shared';
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
 */
export const StationsLayer = () => {
  const { data, isLoading, error } = useStationsQuery({ format: 'geojson' });

  // Don't render if no data
  if (error || isLoading || !data || !('features' in data)) {
    return null;
  }

  const geojson = data as StationFeatureCollection;

  return (
    <Source
      id={STATIONS_SOURCE_ID}
      type="geojson"
      data={geojson}
      cluster={true}
      clusterMaxZoom={14}
      clusterRadius={50}
      clusterProperties={{
        sumDepartures: ['+', ['get', 'totalDepartures']],
      }}
    >
      <StationClustersLayer />
      <StationCirclesLayer />
      <StationSymbolsLayer />
    </Source>
  );
};
