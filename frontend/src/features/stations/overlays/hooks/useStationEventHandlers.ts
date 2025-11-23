import { useCallback, useRef, useMemo, useEffect } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import type { MapMouseEvent, MapTouchEvent } from 'mapbox-gl';
import { useLayerEvents } from '@/features/map/hooks';
import { useStations } from '@/features/stations';
import { useStationCentering } from '@/features/stations/hooks/useStationCentering';
import type { StationMapEventData } from '@/features/stations/types';

/**
 * Station-specific event handling logic
 * Handles click (selection) and hover interactions with MapBox feature state
 * Uses generic useLayerEvents under the hood
 *
 * @param layerId - ID of the layer to attach events to
 * @param sourceId - ID of the GeoJSON source
 *
 * @example
 * useStationEventHandlers(STATIONS_CIRCLES_LAYER_ID, STATIONS_SOURCE_ID);
 */
export const useStationEventHandlers = (layerId: string, sourceId: string): void => {
  const { setHoveredStation, setSelectedDepartureStationId, selectedDepartureStationId } =
    useStations();
  const { main: map } = useMap();
  const { centerOnStation } = useStationCentering({ panelPosition: 'left' });
  const lastHoveredFeatureIdRef = useRef<string | number | null>(null);
  const lastSelectedFeatureIdRef = useRef<string | number | null>(null);

  const onClick = useCallback(
    (e: MapMouseEvent | MapTouchEvent) => {
      if (!map) {
        return;
      }

      const feature = e.features?.[0];
      const stationId = feature?.properties?.['stationId'];
      const featureId = feature?.id;
      const coordinates = (feature?.geometry as GeoJSON.Point)?.coordinates as [number, number];

      if (stationId && coordinates && featureId !== undefined) {
        // Clear previous selection feature-state
        if (lastSelectedFeatureIdRef.current !== null) {
          map.setFeatureState(
            { source: sourceId, id: lastSelectedFeatureIdRef.current },
            { selected: false }
          );
        }

        // Set new selection feature-state
        map.setFeatureState({ source: sourceId, id: featureId }, { selected: true });
        lastSelectedFeatureIdRef.current = featureId;

        setSelectedDepartureStationId(stationId);
        centerOnStation(coordinates);
      }
    },
    [map, sourceId, setSelectedDepartureStationId, centerOnStation]
  );

  const onMouseMove = useCallback(
    (e: MapMouseEvent) => {
      if (!map) {
        return;
      }

      const feature = e.features?.[0];
      const properties = feature?.properties;
      const featureId = feature?.id;
      const stationId = properties?.['stationId'] as string | undefined;

      if (!feature || !properties || featureId === undefined || !stationId) {
        return;
      }

      // Only update if feature changed (avoid redundant updates)
      if (lastHoveredFeatureIdRef.current !== featureId) {
        // Clear previous hover state
        if (lastHoveredFeatureIdRef.current !== null) {
          map.setFeatureState(
            { source: sourceId, id: lastHoveredFeatureIdRef.current },
            { hover: false }
          );
        }

        // Set new hover state
        map.setFeatureState({ source: sourceId, id: featureId }, { hover: true });

        lastHoveredFeatureIdRef.current = featureId;
        map.getCanvas().style.cursor = 'pointer';

        // Build station data object
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
        setHoveredStation({
          stationId,
          coordinates,
          properties: feature.properties as StationMapEventData['properties'],
        });
      }
    },
    [map, sourceId, setHoveredStation]
  );

  const onMouseLeave = useCallback(() => {
    if (!map) {
      return;
    }

    // Clear hover state on the last hovered feature
    if (lastHoveredFeatureIdRef.current !== null) {
      map.setFeatureState(
        { source: sourceId, id: lastHoveredFeatureIdRef.current },
        { hover: false }
      );
    }

    lastHoveredFeatureIdRef.current = null;
    map.getCanvas().style.cursor = '';
    setHoveredStation(null);
  }, [map, sourceId, setHoveredStation]);

  // Clear selection feature-state when Redux state is cleared
  useEffect(() => {
    if (!map || selectedDepartureStationId !== null) {
      return;
    }

    // Selection was cleared in Redux, clear feature-state
    if (lastSelectedFeatureIdRef.current !== null) {
      map.setFeatureState(
        { source: sourceId, id: lastSelectedFeatureIdRef.current },
        { selected: false }
      );
      lastSelectedFeatureIdRef.current = null;
    }
  }, [map, sourceId, selectedDepartureStationId]);

  // Memoize handlers object to prevent unnecessary re-renders in useLayerEvents
  const handlers = useMemo(
    () => ({ onClick, onMouseMove, onMouseLeave }),
    [onClick, onMouseMove, onMouseLeave]
  );

  // Use generic event attachment hook
  useLayerEvents({
    layerId,
    handlers,
  });
};
