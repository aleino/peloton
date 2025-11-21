import { useEffect, useCallback, useRef } from 'react';
import { Source, Layer, useMap } from 'react-map-gl/mapbox';
import type { LayerProps } from 'react-map-gl/mapbox';
import type { ExpressionSpecification, MapMouseEvent, MapTouchEvent } from 'mapbox-gl';
import type { StationFeatureCollection } from '@peloton/shared';
import { useStationsQuery } from '../../api';
import { useStationIcons } from '../../hooks/useStationIcons';
import { useStations } from '../../useStations';
import type { StationMapEventData } from '../../types';
import { createViridisScale } from '@/utils/colorScales';
import {
  STATIONS_SOURCE_ID,
  STATIONS_CIRCLES_LAYER_ID,
  STATIONS_SYMBOLS_LAYER_ID,
  STATIONS_CLUSTERS_LAYER_ID,
  STATIONS_CLUSTER_COUNT_LAYER_ID,
} from '../../config/layers';
import {
  MARKER_RADIUS,
  MARKER_STROKE_WIDTH,
  MARKER_STROKE_COLOR,
  MARKER_OPACITY,
} from '../../config/markerSizes';

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

  // Apply Viridis colors to stations via feature state
  useEffect(() => {
    if (!mainMap || !stationsData || !('features' in stationsData)) {
      return;
    }

    const geojson = stationsData as StationFeatureCollection;

    // Wait for both source AND layer to be available
    const applyColors = () => {
      const source = mainMap.getSource(STATIONS_SOURCE_ID);
      const layer = mainMap.getLayer(STATIONS_CIRCLES_LAYER_ID);

      if (!source || !layer) {
        return;
      }

      setColors();
    };

    // Try immediately
    applyColors();

    // Also listen for idle event in case not ready
    mainMap.once('idle', applyColors);

    function setColors() {
      if (!mainMap || !geojson) return;

      // Calculate departure range
      const departures = geojson.features.map((f) => f.properties.totalDepartures || 0);
      if (departures.length === 0) return;

      const minDepartures = Math.min(...departures);
      const maxDepartures = Math.max(...departures);

      // Sort departures to see distribution
      const sortedDepartures = [...departures].sort((a, b) => a - b);
      const p5 = sortedDepartures[Math.floor(sortedDepartures.length * 0.05)];
      const p95 = sortedDepartures[Math.floor(sortedDepartures.length * 0.95)];

      // Use 5th and 95th percentiles to exclude extreme outliers
      // This ensures better color distribution across the visible range
      const domainMin = p5 ?? minDepartures;
      const domainMax = p95 ?? maxDepartures;

      // Create Viridis color scale with logarithmic transformation
      // Using percentile-based domain to ensure full color spectrum utilization
      const colorScale = createViridisScale(domainMin, domainMax, 'log');

      // Apply colors via feature state
      geojson.features.forEach((feature) => {
        const featureId = feature.id;
        const totalDepartures = feature.properties.totalDepartures || 0;
        const color = colorScale(totalDepartures);

        if (!featureId) {
          return;
        }

        mainMap.setFeatureState(
          { source: STATIONS_SOURCE_ID, id: featureId },
          { viridisColor: color }
        );
      });

      // Force map to repaint after feature states are set
      mainMap.triggerRepaint();
    }

    // Cleanup
    return () => {
      mainMap.off('idle', applyColors);
      geojson.features.forEach((feature) => {
        if (feature.id) {
          mainMap.removeFeatureState({
            source: STATIONS_SOURCE_ID,
            id: feature.id,
          });
        }
      });
    };
  }, [mainMap, stationsData]);

  // Apply Viridis colors to clusters based on average departures
  useEffect(() => {
    if (!mainMap || !stationsData || !('features' in stationsData)) {
      return;
    }

    const geojson = stationsData as StationFeatureCollection;

    const applyClusterColors = () => {
      const source = mainMap.getSource(STATIONS_SOURCE_ID);
      const layer = mainMap.getLayer(STATIONS_CLUSTERS_LAYER_ID);

      if (!source || !layer || !('getClusterLeaves' in source)) {
        return;
      }

      // Calculate color scale using same logic as stations
      const departures = geojson.features.map((f) => f.properties.totalDepartures || 0);
      if (departures.length === 0) return;

      const sortedDepartures = [...departures].sort((a, b) => a - b);
      const p5 = sortedDepartures[Math.floor(sortedDepartures.length * 0.05)];
      const p95 = sortedDepartures[Math.floor(sortedDepartures.length * 0.95)];
      const domainMin = p5 ?? Math.min(...departures);
      const domainMax = p95 ?? Math.max(...departures);

      const colorScale = createViridisScale(domainMin, domainMax, 'log');

      // Get all cluster features and calculate their average departures
      const features = mainMap.querySourceFeatures(STATIONS_SOURCE_ID);
      const clusterFeatures = features.filter((f) => f.properties?.['cluster']);

      clusterFeatures.forEach((feature) => {
        const clusterId = feature.properties?.['cluster_id'];
        if (!clusterId) return;

        // Get all points in this cluster
        source.getClusterLeaves(clusterId, Infinity, 0, (err, leaves) => {
          if (err || !leaves || leaves.length === 0) return;

          // Calculate average departures
          const totalDepartures = leaves.reduce(
            (sum, leaf) => sum + (leaf.properties?.['totalDepartures'] || 0),
            0
          );
          const avgDepartures = totalDepartures / leaves.length;
          const color = colorScale(avgDepartures);

          // Apply color via feature state
          if (feature.id !== undefined) {
            mainMap.setFeatureState(
              { source: STATIONS_SOURCE_ID, id: feature.id },
              { viridisColor: color }
            );
          }
        });
      });
    };

    // Apply colors after source is loaded and on map move (clusters change)
    mainMap.once('idle', applyClusterColors);
    mainMap.on('moveend', applyClusterColors);

    return () => {
      mainMap.off('idle', applyClusterColors);
      mainMap.off('moveend', applyClusterColors);
    };
  }, [mainMap, stationsData]);

  // Update feature states for hover and selection
  useEffect(() => {
    if (!mainMap || !stationsData || !('features' in stationsData)) {
      return;
    }

    const geojson = stationsData as StationFeatureCollection;

    // Wait for source and layer to be ready
    const updateStates = () => {
      const source = mainMap.getSource(STATIONS_SOURCE_ID);
      const layer = mainMap.getLayer(STATIONS_CIRCLES_LAYER_ID);

      if (!source || !layer) {
        return;
      }

      // Update all features with current hover/selected state
      geojson.features.forEach((feature) => {
        if (!feature.id) return;

        const featureId = feature.id;
        const stationId = feature.properties.stationId;

        // Determine state for this station
        const isHovered = stationId === hoveredStationId;
        const isSelected = stationId === selectedDepartureStationId;

        // Update feature state
        mainMap.setFeatureState(
          { source: STATIONS_SOURCE_ID, id: featureId },
          {
            hover: isHovered,
            selected: isSelected,
          }
        );
      });
    };

    // Try immediately
    updateStates();

    // Also try on idle if not ready
    mainMap.once('idle', updateStates);

    // Cleanup
    return () => {
      mainMap.off('idle', updateStates);
    };
  }, [mainMap, stationsData, hoveredStationId, selectedDepartureStationId]);

  // Update icon based on selection/hover state
  useEffect(() => {
    if (!mainMap) {
      return;
    }

    const layer = mainMap.getLayer(STATIONS_SYMBOLS_LAYER_ID);
    if (!layer) {
      return;
    }

    const iconExpression = getIconExpression(selectedDepartureStationId, hoveredStationId);
    mainMap.getMap().setLayoutProperty(STATIONS_SYMBOLS_LAYER_ID, 'icon-image', iconExpression);
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

  const onClusterClick = useCallback(
    (e: MapMouseEvent | MapTouchEvent) => {
      if (!mainMap) {
        return;
      }

      const feature = e.features?.[0];
      if (!feature) {
        return;
      }

      const clusterId = feature.properties?.['cluster_id'];
      const geometry = feature.geometry;

      if (clusterId && geometry?.type === 'Point') {
        const source = mainMap.getSource(STATIONS_SOURCE_ID);

        if (source && 'getClusterExpansionZoom' in source) {
          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) {
              return;
            }

            if (zoom === null || zoom === undefined) {
              return;
            }

            const coordinates = geometry.coordinates as [number, number];
            mainMap.easeTo({
              center: coordinates,
              zoom: zoom,
              duration: 500,
            });
          });
        }
      }
    },
    [mainMap]
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
        return;
      }

      const layerId = STATIONS_CIRCLES_LAYER_ID;

      // Wait for layer to be available (react-map-gl adds layers asynchronously)
      const addListeners = () => {
        const layer = mainMap.getLayer(layerId);
        if (!layer) {
          return;
        }

        mainMap.on('click', layerId, onClick);
        mainMap.on('mousemove', layerId, onMouseMove);
        mainMap.on('mouseleave', layerId, onMouseLeave);
      };

      // Try immediately
      addListeners();

      // Also listen for idle event in case layer wasn't ready
      mainMap.once('idle', addListeners);

      return () => {
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

  // Attach event listeners to cluster layer
  useEffect(
    function addClusterEventListeners() {
      if (!mainMap) {
        return;
      }

      const layerId = STATIONS_CLUSTERS_LAYER_ID;

      const onMouseEnter = () => {
        mainMap.getCanvas().style.cursor = 'pointer';
      };

      const onMouseLeaveCluster = () => {
        mainMap.getCanvas().style.cursor = '';
      };

      const addListeners = () => {
        const layer = mainMap.getLayer(layerId);
        if (!layer) {
          return;
        }

        mainMap.on('click', layerId, onClusterClick);
        mainMap.on('mouseenter', layerId, onMouseEnter);
        mainMap.on('mouseleave', layerId, onMouseLeaveCluster);
      };

      addListeners();
      mainMap.once('idle', addListeners);

      return () => {
        if (mainMap.getLayer(layerId)) {
          mainMap.off('click', layerId, onClusterClick);
          mainMap.off('mouseenter', layerId, onMouseEnter);
          mainMap.off('mouseleave', layerId, onMouseLeaveCluster);
        }
        mainMap.off('idle', addListeners);
      };
    },
    [mainMap, onClusterClick]
  );

  // Early returns
  if (error) {
    return null;
  }

  if (isLoading || !stationsData || !('features' in stationsData)) {
    return null;
  }

  const geojson = stationsData as StationFeatureCollection;

  // Cluster circle layer - shows aggregated stations at lower zoom levels
  const clusterLayerStyle: LayerProps = {
    id: STATIONS_CLUSTERS_LAYER_ID,
    type: 'circle',
    filter: ['has', 'point_count'] as ExpressionSpecification,
    paint: {
      // Size clusters based on number of points
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20, // 20px radius for clusters with < 10 points
        10,
        30, // 30px radius for clusters with 10-50 points
        50,
        40, // 40px radius for clusters with 50+ points
      ] as ExpressionSpecification,
      // Use Viridis color from feature state (same as individual stations)
      'circle-color': [
        'coalesce',
        ['feature-state', 'viridisColor'],
        '#51bbd6', // Fallback color while calculating
      ] as ExpressionSpecification,
      'circle-opacity': 0.8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  };

  // Cluster count layer - shows number of stations in each cluster
  const clusterCountLayerStyle: LayerProps = {
    id: STATIONS_CLUSTER_COUNT_LAYER_ID,
    type: 'symbol',
    filter: ['has', 'point_count'] as ExpressionSpecification,
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 14,
    },
    paint: {
      'text-color': '#ffffff',
    },
  };

  // Circle layer for Viridis colored backgrounds
  const circleLayerStyle: LayerProps = {
    filter: ['!', ['has', 'point_count']] as ExpressionSpecification,
    id: STATIONS_CIRCLES_LAYER_ID,
    type: 'circle',
    paint: {
      // Dynamic radius based on state
      'circle-radius': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        MARKER_RADIUS.SELECTED,
        ['boolean', ['feature-state', 'hover'], false],
        MARKER_RADIUS.HOVER,
        MARKER_RADIUS.DEFAULT,
      ] as ExpressionSpecification,

      // Keep Viridis color
      'circle-color': [
        'coalesce',
        ['feature-state', 'viridisColor'],
        '#ffffff',
      ] as ExpressionSpecification,

      'circle-opacity': MARKER_OPACITY,

      // Dynamic stroke width
      'circle-stroke-width': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        MARKER_STROKE_WIDTH.SELECTED,
        ['boolean', ['feature-state', 'hover'], false],
        MARKER_STROKE_WIDTH.HOVER,
        MARKER_STROKE_WIDTH.DEFAULT,
      ] as ExpressionSpecification,

      'circle-stroke-color': MARKER_STROKE_COLOR,

      // Smooth transitions
      'circle-radius-transition': {
        duration: 200,
        delay: 0,
      },
      'circle-stroke-width-transition': {
        duration: 200,
        delay: 0,
      },
    },
  };

  const symbolLayerStyle: LayerProps = {
    id: STATIONS_SYMBOLS_LAYER_ID,
    type: 'symbol',
    filter: ['!', ['has', 'point_count']] as ExpressionSpecification,
    layout: {
      'icon-image': 'station-icon-default',
      'icon-size': 1,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
  };

  return (
    <Source
      id={STATIONS_SOURCE_ID}
      type="geojson"
      data={geojson}
      cluster={true}
      clusterMaxZoom={14}
      clusterRadius={50}
    >
      <Layer {...clusterLayerStyle} />
      <Layer {...clusterCountLayerStyle} />
      <Layer {...circleLayerStyle} />
      <Layer {...symbolLayerStyle} />
    </Source>
  );
};
