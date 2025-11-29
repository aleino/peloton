import { useMemo, useState, useEffect } from 'react';
import { Source, Layer, useMap } from 'react-map-gl/mapbox';
import type { ExpressionSpecification, FillLayerSpecification } from 'mapbox-gl';
import type { FeatureCollection } from 'geojson';
import { useColorScaleExpression } from '../hooks/useColorScaleExpression';
import { useStationEventHandlers } from '../hooks/useStationEventHandlers';
import { useHelsinkiAreaBoundary } from '../hooks/useHelsinkiAreaBoundary';
import { generateVoronoiPolygons } from '../utils/generateVoronoi';
import { getStationPropertyName } from '../utils/metricProperties';
import { useMapSource } from '@/features/map/hooks/useMapSource';
import { useMapControls, useWaterLayerOrder } from '@/features/map/hooks';
import type { FlattenedStationFeatureCollection } from '@/features/stations/api/useStationsQuery';
import {
  STATIONS_SOURCE_ID,
  VORONOI_SOURCE_ID,
  VORONOI_LAYER_ID,
} from '@/features/stations/config/layers';
import { TRANSITION_DURATION } from '../config';
import type { MapStyle } from '@/features/map/types';
import { useAppSelector } from '@/store/hooks';
import { selectColorScale } from '@/features/map/mapControls.store';
import type { FlattenedStationFeatureProperties } from '@/features/stations/api/useStationsQuery';

/**
 * Voronoi polygon layer component for station visualization
 *
 * Displays Voronoi tessellation cells colored by the selected metric,
 * using the same Viridis color scale as circle markers.
 *
 * Responsibilities:
 * - Generate Voronoi polygons from station points
 * - Apply Viridis color scale to cells
 * - Handle hover and selection interaction states
 * - Clip cells to Helsinki area boundary
 * - Manage water layer ordering for proper z-index
 *
 * Technical Details:
 * - Creates a separate Source because geometry type is Polygon (not Point)
 * - Uses generateId={true} to enable feature-state for hover/selection
 * - Preserves all station properties from original point features
 * - Clips cells to Helsinki area boundary to avoid extending beyond map bounds
 * - Moves water layers to top and renders Voronoi below them
 */
export const StationVoronoiLayer = () => {
  const { main: map } = useMap();
  const { style } = useMapControls();
  const scaleType = useAppSelector(selectColorScale);

  // Track water layer state: ready flag, first water layer ID, and the style it was set up for
  const [waterLayerState, setWaterLayerState] = useState<{
    ready: boolean;
    firstWaterLayerId: string | undefined;
    style: MapStyle;
  }>({ ready: false, firstWaterLayerId: undefined, style });

  // Water layer order management
  const { moveWaterLayersToTop, saveOriginalOrder } = useWaterLayerOrder();

  // Get station data from the existing source
  const stationData = useMapSource<FlattenedStationFeatureCollection>(STATIONS_SOURCE_ID);

  // Load Helsinki area boundary for Voronoi bounds
  const { data: boundary, isLoading: boundaryLoading } = useHelsinkiAreaBoundary();

  // Read metric and direction from map controls
  const { metric, direction } = useMapControls();

  // Move water layers to top when component mounts or style changes
  useEffect(() => {
    if (!map) {
      return;
    }

    const mapInstance = map.getMap();
    let cleanedUp = false;

    const setupWaterLayers = () => {
      if (cleanedUp || !mapInstance.isStyleLoaded()) {
        return false;
      }

      // First save the original order, then move water layers to top
      saveOriginalOrder();
      const firstWaterId = moveWaterLayersToTop();

      if (firstWaterId) {
        setWaterLayerState({
          ready: true,
          firstWaterLayerId: firstWaterId,
          style,
        });
        return true;
      }
      return false;
    };

    // Try immediately if style is loaded
    if (mapInstance.isStyleLoaded()) {
      const success = setupWaterLayers();

      // If setup failed (no water layers found), wait for idle event
      // Sometimes layers aren't queryable immediately after style.load
      if (!success) {
        const onIdle = () => {
          setupWaterLayers();
        };
        mapInstance.once('idle', onIdle);

        return () => {
          cleanedUp = true;
          mapInstance.off('idle', onIdle);
        };
      }
      return;
    }

    // Wait for style to load - use idle event as it's more reliable than style.load
    const onIdle = () => {
      setupWaterLayers();
    };

    // Also listen for style.load as backup
    const onStyleLoad = () => {
      // After style.load, wait for idle to ensure layers are ready
      const onIdleAfterStyleLoad = () => {
        setupWaterLayers();
      };
      mapInstance.once('idle', onIdleAfterStyleLoad);
    };

    mapInstance.once('idle', onIdle);
    mapInstance.once('style.load', onStyleLoad);

    return () => {
      cleanedUp = true;
      mapInstance.off('idle', onIdle);
      mapInstance.off('style.load', onStyleLoad);
    };
  }, [map, style, saveOriginalOrder, moveWaterLayersToTop]);

  // Determine if water layers are ready for the current style
  const waterLayersReady = waterLayerState.ready && waterLayerState.style === style;
  const beforeId = waterLayersReady ? waterLayerState.firstWaterLayerId : undefined;

  // Determine which property to use for coloring
  const propertyName = getStationPropertyName(metric, direction);

  // Generate dynamic Mapbox expression for the selected metric
  const inputValue: ExpressionSpecification = ['get', propertyName];

  // Calculate stats for color scale
  const { min, max, values } = useMemo(() => {
    if (!stationData || stationData.features.length === 0) {
      return { min: 0, max: 0, values: [] };
    }

    const vals = stationData.features.map((f) => {
      const value = f.properties[propertyName as keyof FlattenedStationFeatureProperties];
      return (value as number | undefined) ?? 0;
    });

    if (vals.length === 0) {
      return { min: 0, max: 0, values: [] };
    }

    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);

    // Calculate percentiles for linear/log scales to avoid outliers
    // We do this here to pass "clean" min/max to the hook
    const sorted = [...vals].sort((a, b) => a - b);
    const p1Index = Math.max(0, Math.floor(sorted.length * 0.01));
    const p99Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.99) - 1);
    const p1Value = sorted[p1Index] ?? minVal;
    const p99Value = sorted[p99Index] ?? maxVal;

    return {
      min: p1Value,
      max: p99Value,
      values: vals,
    };
  }, [stationData, propertyName]);

  // Generate Voronoi polygons (memoized to avoid recalculation)
  const voronoiData = useMemo(() => {
    if (!stationData || !boundary) {
      return null;
    }

    // Filter out cluster features (only use individual stations)
    // Clusters have a 'cluster' property set to true
    const individualStations: FlattenedStationFeatureCollection = {
      type: 'FeatureCollection',
      features: stationData.features.filter(
        (f) => !(f.properties as unknown as Record<string, unknown>)['cluster']
      ),
    };

    if (individualStations.features.length === 0) {
      return null;
    }

    // Generate Voronoi polygons with Helsinki area boundary
    // Type assertion needed because FlattenedStationFeatureProperties is compatible with Record<string, unknown>
    return generateVoronoiPolygons(
      individualStations as unknown as FeatureCollection<GeoJSON.Point, Record<string, unknown>>,
      {
        bounds: boundary.bounds,
        clipPolygon: boundary.coordinates,
      }
    );
  }, [stationData, boundary]);

  // Generate color scale expression based on selected metric and direction
  const colorExpression = useColorScaleExpression({
    minValue: min,
    maxValue: max,
    scaleType,
    inputValue,
    isDiverging: direction === 'diff',
    values,
  });

  // Define Voronoi fill layer style (memoized to avoid recreating on every render)
  const voronoiLayerStyle: FillLayerSpecification = useMemo(
    () => ({
      id: VORONOI_LAYER_ID,
      type: 'fill',
      source: VORONOI_SOURCE_ID,
      paint: {
        'fill-color': colorExpression,
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          1.0, // Full opacity for selected
          ['boolean', ['feature-state', 'hover'], false],
          0.9, // Higher opacity on hover
          0.7, // Default opacity
        ],
        'fill-opacity-transition': {
          duration: TRANSITION_DURATION.LAYER_OPACITY,
          delay: 0,
        },
        'fill-outline-color': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          '#FFC107', // Amber for selected (better visibility than white)
          ['boolean', ['feature-state', 'hover'], false],
          '#ffffff', // White outline on hover
          'rgba(255, 255, 255, 0.6)', // Increased from 0.3 to 0.6
        ],
      },
    }),
    [colorExpression]
  );

  // Determine if layer is ready to render and attach events
  const isReady = !!(voronoiData && !boundaryLoading && waterLayersReady && beforeId);

  // Set up event handlers for hover and click (only when layer is ready)
  useStationEventHandlers(VORONOI_LAYER_ID, VORONOI_SOURCE_ID, { enabled: isReady });

  // Don't render if data not ready or water layers not ready
  if (!isReady) {
    return null;
  }

  return (
    <Source
      id={VORONOI_SOURCE_ID}
      type="geojson"
      data={voronoiData as unknown as GeoJSON.FeatureCollection}
      generateId={true} // Required for feature-state (hover/selection)
    >
      <Layer {...voronoiLayerStyle} beforeId={beforeId} />
    </Source>
  );
};
