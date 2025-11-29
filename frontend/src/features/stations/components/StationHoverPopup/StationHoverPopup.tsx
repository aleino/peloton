import { useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { Popup } from 'mapbox-gl';
import { useStations } from '../../useStations';
import { useMapControls } from '@/features/map/hooks';
import { getStationPropertyName } from '../../overlays/utils/metricProperties';
import type { Metric, Direction } from '@/features/map/types';
import type { StationMapEventData } from '../../types';
import './StationHoverPopup.css';

/**
 * Format number according to Finnish locale
 */
const formatNumber = (value: number, decimals = 0): string => {
  return value.toLocaleString('fi-FI', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Get the metric value from properties
 */
const getMetricValue = (
  properties: StationMapEventData['properties'],
  metric: Metric,
  direction: Direction
): number | null => {
  const propertyName = getStationPropertyName(metric, direction);
  const value = properties[propertyName as keyof typeof properties];

  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
};

/**
 * Build tooltip content for basic metrics (count, time, distance)
 */
const buildBasicMetricTooltip = (
  value: number,
  metric: Metric,
  direction: Direction
): { line1: string; line2: string } => {
  let line1 = '';
  let line2 = '';

  switch (metric) {
    case 'tripCount':
      line1 = formatNumber(value);
      line2 = direction === 'departures' ? 'Departures' : 'Arrivals';
      break;
    case 'durationAvg':
      // Duration is in seconds, convert to minutes
      line1 = `${formatNumber(value / 60, 0)} min`;
      line2 = direction === 'departures' ? 'Avg. departure' : 'Avg. arrival';
      break;
    case 'distanceAvg':
      // Distance is in meters
      line1 = `${formatNumber(value)} m`;
      line2 = direction === 'departures' ? 'Avg. departure' : 'Avg. arrival';
      break;
  }

  return { line1, line2 };
};

/**
 * Build tooltip content for difference metrics
 */
const buildDifferenceMetricTooltip = (
  value: number,
  metric: Metric
): { line1: string; line2: string } | null => {
  // value is a decimal from -1 to 1, convert to percentage
  const percentage = Math.abs(value * 100);
  const formattedPercentage = formatNumber(percentage, 0);

  // Determine comparison word based on metric and sign
  let comparisonWord = '';

  if (metric === 'tripCount') {
    comparisonWord = value > 0 ? 'more' : 'fewer';
    return {
      line1: `${formattedPercentage}% ${comparisonWord}`,
      line2: 'departures vs. arrivals',
    };
  }

  // Time and Distance differences
  if (metric === 'durationAvg') {
    comparisonWord = value > 0 ? 'longer' : 'shorter';
    return {
      line1: `${formattedPercentage}% ${comparisonWord}`,
      line2: 'departure vs. arrival time',
    };
  } else if (metric === 'distanceAvg') {
    comparisonWord = value > 0 ? 'longer' : 'shorter';
    return {
      line1: `${formattedPercentage}% ${comparisonWord}`,
      line2: 'departure vs. arrival distance',
    };
  }

  return null;
};

/**
 * Build popup HTML based on visualization mode
 */
const buildPopupHTML = (
  properties: StationMapEventData['properties'],
  metric: Metric,
  direction: Direction
): string => {
  const value = getMetricValue(properties, metric, direction);

  if (value === null) {
    return `
      <div class="station-hover-popup station-hover-popup--voronoi">
        <div class="station-hover-popup__header">
          <div class="station-hover-popup__name">${properties.name}</div>
        </div>
        <div class="station-hover-popup__context">
          No data available
        </div>
      </div>
    `;
  }

  // Build metric content based on direction
  let metricHtml = '';

  if (direction === 'diff') {
    const diffContent = buildDifferenceMetricTooltip(value, metric);
    if (diffContent) {
      metricHtml = `
        <div class="station-hover-popup__metric">
          <div class="station-hover-popup__metric-line station-hover-popup__metric-line--bold">${diffContent.line1}</div>
          <div class="station-hover-popup__metric-line">${diffContent.line2}</div>
        </div>
      `;
    }
  } else {
    const basicContent = buildBasicMetricTooltip(value, metric, direction);
    metricHtml = `
      <div class="station-hover-popup__metric">
        <div class="station-hover-popup__metric-line station-hover-popup__metric-line--bold">${basicContent.line1}</div>
        <div class="station-hover-popup__metric-line">${basicContent.line2}</div>
      </div>
    `;
  }

  return `
    <div class="station-hover-popup station-hover-popup--voronoi">
      <div class="station-hover-popup__header">
        <div class="station-hover-popup__name">${properties.name}</div>
      </div>
      ${metricHtml}
    </div>
  `;
};

/**
 * Hover popup showing context-aware station information
 *
 * Uses Mapbox GL JS native Popup API for full control over styling and behavior.
 * Displays different content based on visualization mode:
 * - Points mode: Station name + ID
 * - Voronoi mode: Station name + context + metric value + story
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

    const map = mainMap.getMap();

    // If we have hover data, create or update the popup
    if (hoveredStation) {
      const { coordinates, properties } = hoveredStation;
      const popupHTML = buildPopupHTML(properties, metric, direction);

      // Create popup instance if it doesn't exist
      if (!popupRef.current) {
        popupRef.current = new Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 20,
          maxWidth: '300px',
          className: 'station-hover-popup-container',
        }).addTo(map);
      }

      // Update existing popup
      popupRef.current.setLngLat(coordinates).setHTML(popupHTML);
    } else {
      // No hover data, remove popup if it exists
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    }

    // Cleanup on unmount
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
