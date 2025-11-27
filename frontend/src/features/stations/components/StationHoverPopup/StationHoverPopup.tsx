import { useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { Popup } from 'mapbox-gl';
import { useStations } from '../../useStations';
import { useMapControls } from '@/features/map/hooks';
import { getStationPropertyName } from '../../overlays/utils/metricProperties';
import type { Metric, Direction, Visualization } from '@/features/map/types';
import type { StationMapEventData } from '../../types';
import './StationHoverPopup.css';

/**
 * Format metric value with appropriate units and precision
 */
const formatMetricValue = (
  properties: StationMapEventData['properties'],
  metric: Metric,
  direction: Direction
): string => {
  const propertyName = getStationPropertyName(metric, direction);
  const value = properties[propertyName as keyof typeof properties];

  if (value === null || value === undefined) {
    return 'No data';
  }

  // For diff direction, show as percentage
  if (direction === 'diff') {
    const decimal = Number(value);
    const sign = decimal >= 0 ? '+' : '';
    return `${sign}${(decimal * 100).toFixed(1)}%`;
  }

  switch (metric) {
    case 'tripCount':
      return `${Number(value).toLocaleString()} trips`;
    case 'durationAvg': {
      // Duration is in seconds, convert to minutes
      const minutes = Math.round(Number(value) / 60);
      return `${minutes} min avg`;
    }
    case 'distanceAvg': {
      // Distance is in meters, convert to km if >= 1000
      const meters = Number(value);
      if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km avg`;
      }
      return `${Math.round(meters)} m avg`;
    }
    default:
      return String(value);
  }
};

/**
 * Get human-readable direction label
 */
const getDirectionLabel = (direction: Direction): string => {
  const labels: Record<Direction, string> = {
    departures: 'departures',
    arrivals: 'arrivals',
    diff: 'net flow',
  };
  return labels[direction];
};

/**
 * Build popup HTML based on visualization mode
 */
const buildPopupHTML = (
  properties: StationMapEventData['properties'],
  visualization: Visualization,
  metric: Metric,
  direction: Direction
): string => {
  if (visualization === 'voronoi') {
    return `
      <div class="station-hover-popup station-hover-popup--voronoi">
        <div class="station-hover-popup__name">${properties.name}</div>
        <div class="station-hover-popup__context">
          Closest station in this area
        </div>
        <div class="station-hover-popup__metric">
          ${formatMetricValue(properties, metric, direction)}
          <span class="station-hover-popup__direction">${getDirectionLabel(direction)}</span>
        </div>
      </div>
    `;
  }

  // Points mode - original behavior
  return `
    <div class="station-hover-popup">
      <div class="station-hover-popup__name">${properties.name}</div>
      <div class="station-hover-popup__id">ID: ${properties.stationId}</div>
    </div>
  `;
};

/**
 * Hover popup showing context-aware station information
 *
 * Uses Mapbox GL JS native Popup API for full control over styling and behavior.
 * Displays different content based on visualization mode:
 * - Points mode: Station name + ID
 * - Voronoi mode: Station name + context + metric value
 *
 * @example
 * ```tsx
 * <StationHoverPopup />
 * ```
 */
export const StationHoverPopup = () => {
  const { main: mainMap } = useMap();
  const { hoveredStation } = useStations();
  const { visualization, metric, direction } = useMapControls();
  const popupRef = useRef<Popup | null>(null);

  useEffect(() => {
    if (!mainMap) {
      return;
    }

    // Remove existing popup
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    // Create new popup if we have hover data
    if (hoveredStation) {
      const { coordinates, properties } = hoveredStation;

      const popupHTML = buildPopupHTML(properties, visualization, metric, direction);

      const popup = new Popup({
        closeButton: false,
        closeOnClick: false,
        anchor: 'bottom',
        offset: 20,
        maxWidth: '300px',
        className: 'station-hover-popup-container',
      })
        .setLngLat(coordinates)
        .setHTML(popupHTML)
        .addTo(mainMap.getMap());

      popupRef.current = popup;
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    };
  }, [mainMap, hoveredStation, visualization, metric, direction]);

  // This component doesn't render anything - it manages the native popup imperatively
  return null;
};
