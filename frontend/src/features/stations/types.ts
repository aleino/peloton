import type { StationFeature } from '@peloton/shared';

/**
 * Internal state for station layer hover and selection
 */
export interface StationLayerState {
  hoveredStationId: string | null;
  selectedStationId: string | null;
}

/**
 * Data passed to station map event callbacks
 *
 * Contains station information and map coordinates
 * for click and hover handlers.
 */
export interface StationMapEventData {
  stationId: string;
  coordinates: [number, number];
  properties: StationFeature['properties'];
}
