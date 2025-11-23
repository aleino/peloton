import { useEffect, useCallback, useRef } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import type { MapMouseEvent } from 'mapbox-gl';
import { useStations } from '../useStations';
import { STATIONS_CIRCLES_LAYER_ID } from '../config/layers';
import type { StationMapEventData } from '../types';

/**
 * Hook to show all station tooltips when mouse button is pressed and held
 *
 * Listens for mousedown and mouseup events on the map.
 * When mouse button is held for more than 300ms without dragging,
 * queries all visible station features and displays tooltips.
 *
 * @example
 * useAllTooltipsOnPress();
 */
export const useAllTooltipsOnPress = (): void => {
  const { main: map } = useMap();
  const { setShowAllTooltips, setVisibleStationsForTooltips } = useStations();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    // Cancel the tooltip timer if dragging starts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleMouseDown = useCallback(
    (e: MapMouseEvent) => {
      if (!map) {
        return;
      }

      // Store initial mouse position
      mouseDownPosRef.current = { x: e.point.x, y: e.point.y };
      isDraggingRef.current = false;

      // Set a delay before showing tooltips (200ms)
      timeoutRef.current = setTimeout(() => {
        // Only show tooltips if we haven't started dragging
        if (isDraggingRef.current || !mouseDownPosRef.current) {
          return;
        }

        const mapInstance = map.getMap();

        // Query all visible station features within viewport
        const features = mapInstance.queryRenderedFeatures({
          layers: [STATIONS_CIRCLES_LAYER_ID],
        });

        if (features.length === 0) {
          return;
        }

        // Convert features to StationMapEventData format
        const stations: StationMapEventData[] = features
          .filter((feature) => {
            // Filter out cluster features
            const isCluster = feature.properties?.['cluster'];
            return !isCluster && feature.properties?.['stationId'];
          })
          .map((feature) => {
            const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
            return {
              stationId: feature.properties!['stationId'] as string,
              coordinates,
              properties: feature.properties as StationMapEventData['properties'],
            };
          });

        // Update Redux state to show all tooltips
        setVisibleStationsForTooltips(stations);
        setShowAllTooltips(true);
      }, 100);
    },
    [map, setShowAllTooltips, setVisibleStationsForTooltips]
  );

  const handleMouseMove = useCallback((e: MapMouseEvent) => {
    if (!mouseDownPosRef.current) {
      return;
    }

    // Check if mouse has moved more than 5px (indicating a drag)
    const dx = Math.abs(e.point.x - mouseDownPosRef.current.x);
    const dy = Math.abs(e.point.y - mouseDownPosRef.current.y);

    if (dx > 5 || dy > 5) {
      isDraggingRef.current = true;
      // Cancel the tooltip timer if dragging
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    // Clear the timeout if mouse is released before delay
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Reset state
    mouseDownPosRef.current = null;
    isDraggingRef.current = false;

    // Hide all tooltips when mouse button is released
    setShowAllTooltips(false);
    setVisibleStationsForTooltips([]);
  }, [setShowAllTooltips, setVisibleStationsForTooltips]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const mapInstance = map.getMap();

    // Add event listeners
    mapInstance.on('mousedown', handleMouseDown);
    mapInstance.on('mousemove', handleMouseMove);
    mapInstance.on('mouseup', handleMouseUp);
    mapInstance.on('dragstart', handleDragStart);

    // Cleanup on unmount
    return () => {
      mapInstance.off('mousedown', handleMouseDown);
      mapInstance.off('mousemove', handleMouseMove);
      mapInstance.off('mouseup', handleMouseUp);
      mapInstance.off('dragstart', handleDragStart);
    };
  }, [map, handleMouseDown, handleMouseMove, handleMouseUp, handleDragStart]);
};
