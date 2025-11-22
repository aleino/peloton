import { useState, useEffect } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { waitForSource } from '../utils/mapReadyState';

/**
 * Get GeoJSON data from a map source
 * Returns typed data when source is ready
 *
 * @param sourceId - ID of the GeoJSON source
 * @returns GeoJSON data or null if not ready
 *
 * @example
 * const stationsData = useMapSource<StationFeatureCollection>('stations-source');
 *
 * if (stationsData) {
 *   console.log(`Loaded ${stationsData.features.length} stations`);
 * }
 */
export const useMapSource = <T extends GeoJSON.GeoJSON>(sourceId: string): T | null => {
  const { main: map } = useMap();
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    if (!map) return;

    return waitForSource(map, sourceId, () => {
      const source = map.getSource(sourceId);
      if (source && source.type === 'geojson') {
        // Access data from GeoJSON source
        const sourceData = (source as mapboxgl.GeoJSONSource).serialize().data;
        if (sourceData && typeof sourceData !== 'string') {
          setData(sourceData as T);
        }
      }
    });
  }, [map, sourceId]);

  return data;
};
