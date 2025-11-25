import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setStyle,
  setVisualization,
  setDirection,
  setMetric,
  setMapControls,
  selectMapStyle,
  selectVisualization,
  selectDirection,
  selectMetric,
  selectMapControls,
} from '@/features/map/mapControls.store';
import type { MapStyle, Direction, Metric, Visualization } from '../types';

/**
 * Hook for managing map controls state
 *
 * Provides access to map control state and actions for:
 * - Map style (dark, light, satellite, streets)
 * - Visualization type (points, voronoi)
 * - Data direction (departures, arrivals, diff)
 * - Data metric (tripCount, durationAvg, distanceAvg)
 *
 * This is a simpler version focused on state management without menu UI logic.
 * For menu-specific functionality, use `useControlMenus` instead.
 */
export const useMapControls = () => {
  const dispatch = useAppDispatch();

  // Select individual state values
  const style = useAppSelector(selectMapStyle);
  const visualization = useAppSelector(selectVisualization);
  const direction = useAppSelector(selectDirection);
  const metric = useAppSelector(selectMetric);

  // Select all controls at once (useful for URL sync)
  const controls = useAppSelector(selectMapControls);

  // Action dispatchers
  const updateStyle = (newStyle: MapStyle) => {
    dispatch(setStyle(newStyle));
  };

  const updateVisualization = (newVisualization: Visualization) => {
    dispatch(setVisualization(newVisualization));
  };

  const updateDirection = (newDirection: Direction) => {
    dispatch(setDirection(newDirection));
  };

  const updateMetric = (newMetric: Metric) => {
    dispatch(setMetric(newMetric));
  };

  const updateControls = (
    newControls: Partial<{
      style: MapStyle;
      visualization: Visualization;
      direction: Direction;
      metric: Metric;
    }>
  ) => {
    dispatch(setMapControls(newControls));
  };

  return {
    // State
    style,
    visualization,
    direction,
    metric,
    controls,

    // Actions
    updateStyle,
    updateVisualization,
    updateDirection,
    updateMetric,
    updateControls,
  };
};
