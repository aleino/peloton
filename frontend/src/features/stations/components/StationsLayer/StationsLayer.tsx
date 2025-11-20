import { useEffect, useCallback, useRef } from 'react';
import { Source, Layer, useMap } from 'react-map-gl/mapbox';
import type { LayerProps } from 'react-map-gl/mapbox';
import type { ExpressionSpecification, MapMouseEvent, MapTouchEvent } from 'mapbox-gl';
import type { StationFeatureCollection } from '@peloton/shared';
import { useStationsQuery } from '../../api';
import { useStationIcons } from '../../hooks/useStationIcons';
import { useStations } from '../../useStations';
import type { StationMapEventData } from '../../types';

/**
 * Generate Mapbox expression for station icon based on selection/hover state
 */
const getIconExpression = (
  selectedId: string | null,
  hoveredId: string | null
): string | ExpressionSpecification => {
  if (!selectedId && !hoveredId) {
    return 'station-icon-default';
  }

  const conditions: unknown[] = ['case'];

  if (selectedId) {
    conditions.push(['==', ['get', 'stationId'], selectedId], 'station-icon-active');
  }
  if (hoveredId) {
    conditions.push(['==', ['get', 'stationId'], hoveredId], 'station-icon-hover');
  }

  conditions.push('station-icon-default');
  return conditions as ExpressionSpecification;
};

export const StationsLayer = () => {
  const { data: stationsData, isLoading, error } = useStationsQuery({ format: 'geojson' });
  const {
    hoveredStation,
    setHoveredStation,
    selectedDepartureStationId,
    setSelectedDepartureStationId,
  } = useStations();
  const { main: mainMap } = useMap();
  const lastHoveredStationIdRef = useRef<string | null>(null);

  const hoveredStationId = hoveredStation?.stationId ?? null;

  useStationIcons();

  // Update icon based on selection/hover state
  useEffect(() => {
    if (!mainMap) {
      return;
    }

    const layer = mainMap.getLayer('stations-layer');
    if (!layer) {
      return;
    }

    const iconExpression = getIconExpression(selectedDepartureStationId, hoveredStationId);
    mainMap.getMap().setLayoutProperty('stations-layer', 'icon-image', iconExpression);
  }, [mainMap, selectedDepartureStationId, hoveredStationId]);

  // Event handlers
  const onClick = useCallback(
    (e: MapMouseEvent | MapTouchEvent) => {
      const stationId = e.features?.[0]?.properties?.['stationId'];
      if (stationId) {
        setSelectedDepartureStationId(stationId);
      }
    },
    [setSelectedDepartureStationId]
  );

  const onMouseMove = useCallback(
    (e: MapMouseEvent) => {
      if (!mainMap) {
        return;
      }

      const feature = e.features?.[0];
      const stationId = feature?.properties?.['stationId'];

      if (stationId && feature?.geometry?.type === 'Point') {
        // Only update if station has changed to prevent flickering
        if (lastHoveredStationIdRef.current === stationId) {
          return;
        }

        lastHoveredStationIdRef.current = stationId;
        mainMap.getCanvas().style.cursor = 'pointer';

        // Update hover state with full station data
        const coordinates = feature.geometry.coordinates as [number, number];
        setHoveredStation({
          stationId,
          coordinates,
          properties: feature.properties as StationMapEventData['properties'],
        });
      }
    },
    [mainMap, setHoveredStation]
  );

  const onMouseLeave = useCallback(() => {
    if (!mainMap) {
      return;
    }

    lastHoveredStationIdRef.current = null;
    mainMap.getCanvas().style.cursor = '';

    // Clear hover state
    setHoveredStation(null);
  }, [mainMap, setHoveredStation]);

  // Attach event listeners to layer
  useEffect(
    function addEventListeners() {
      if (!mainMap) {
        console.warn('no main map');
        return;
      }

      const layerId = 'stations-layer';

      // Wait for layer to be available (react-map-gl adds layers asynchronously)
      const addListeners = () => {
        const layer = mainMap.getLayer(layerId);
        if (!layer) {
          console.warn('Layer not yet available, will retry on idle');
          return;
        }

        console.log('add event listeners');
        mainMap.on('click', layerId, onClick);
        mainMap.on('mousemove', layerId, onMouseMove);
        mainMap.on('mouseleave', layerId, onMouseLeave);
      };

      // Try immediately
      addListeners();

      // Also listen for idle event in case layer wasn't ready
      mainMap.once('idle', addListeners);

      return () => {
        console.log('remove event listeners');
        if (mainMap.getLayer(layerId)) {
          mainMap.off('click', layerId, onClick);
          mainMap.off('mousemove', layerId, onMouseMove);
          mainMap.off('mouseleave', layerId, onMouseLeave);
        }
        mainMap.off('idle', addListeners);
      };
    },
    [mainMap, onClick, onMouseMove, onMouseLeave]
  );

  // Early returns
  if (error) {
    console.error('Failed to load stations:', error);
    return null;
  }

  if (isLoading || !stationsData || !('features' in stationsData)) {
    return null;
  }

  const geojson = stationsData as StationFeatureCollection;

  const layerStyle: LayerProps = {
    id: 'stations-layer',
    type: 'symbol',
    layout: {
      'icon-image': 'station-icon-default', // Updated dynamically via setLayoutProperty
      'icon-size': 1,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
  };

  return (
    <Source id="stations-source" type="geojson" data={geojson}>
      <Layer {...layerStyle} />
    </Source>
  );
};
