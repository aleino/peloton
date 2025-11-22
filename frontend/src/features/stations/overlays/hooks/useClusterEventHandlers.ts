import { useCallback, useMemo } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import type { MapMouseEvent, MapTouchEvent } from 'mapbox-gl';
import { useLayerEvents } from '@/features/map/hooks';
import { STATIONS_SOURCE_ID } from '@/features/stations/config/layers';

/**
 * Cluster-specific event handling logic
 * Handles click to zoom into cluster
 *
 * @param layerId - ID of the cluster layer to attach events to
 *
 * @example
 * useClusterEventHandlers(STATIONS_CLUSTERS_LAYER_ID);
 */
export const useClusterEventHandlers = (layerId: string): void => {
  const { main: map } = useMap();

  const onClick = useCallback(
    (e: MapMouseEvent | MapTouchEvent) => {
      if (!map) {
        return;
      }

      const feature = e.features?.[0];
      if (!feature) {
        return;
      }

      const clusterId = feature.properties?.['cluster_id'];
      const geometry = feature.geometry;

      if (clusterId && geometry?.type === 'Point') {
        const source = map.getSource(STATIONS_SOURCE_ID);

        if (source && 'getClusterExpansionZoom' in source) {
          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) {
              return;
            }

            if (zoom === null || zoom === undefined) {
              return;
            }

            const coordinates = geometry.coordinates as [number, number];
            map.easeTo({
              center: coordinates,
              zoom: zoom,
              duration: 500,
            });
          });
        }
      }
    },
    [map]
  );

  const onMouseEnter = useCallback(() => {
    if (!map) {
      return;
    }
    map.getCanvas().style.cursor = 'pointer';
  }, [map]);

  const onMouseLeave = useCallback(() => {
    if (!map) {
      return;
    }
    map.getCanvas().style.cursor = '';
  }, [map]);

  // Memoize handlers object to prevent unnecessary re-renders in useLayerEvents
  const handlers = useMemo(
    () => ({ onClick, onMouseEnter, onMouseLeave }),
    [onClick, onMouseEnter, onMouseLeave]
  );

  // Use generic event attachment hook
  useLayerEvents({
    layerId,
    handlers,
  });
};
