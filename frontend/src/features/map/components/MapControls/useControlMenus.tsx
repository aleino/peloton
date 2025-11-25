import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setStyle,
  setVisualization,
  setDirection,
  setMetric,
  toggleMenu,
  selectMapStyle,
  selectVisualization,
  selectDirection,
  selectMetric,
  selectOpenMenu,
} from '@/features/map/mapControls.store';
import type { MapStyle, Direction, Metric, Visualization, MenuType } from '../../types';

/**
 * Hook for managing map control state via Redux
 *
 * Provides state and handlers for map controls including:
 * - Map style selection (dark, light, satellite, streets)
 * - Trip direction filtering (departures, arrivals, diff)
 * - Data metric selection (tripCount, durationAvg, distanceAvg)
 * - Visualization type (points, voronoi)
 * - Menu UI state (which submenu is open)
 *
 * Note: Menu close has a 300ms delay to show selection feedback
 */
export const useControlMenus = () => {
  const dispatch = useAppDispatch();

  // Select state from Redux
  const openMenu = useAppSelector(selectOpenMenu);
  const selectedStyle = useAppSelector(selectMapStyle);
  const selectedDirection = useAppSelector(selectDirection);
  const selectedMetric = useAppSelector(selectMetric);
  const selectedVisualization = useAppSelector(selectVisualization);

  const handleMenuToggle = (menu: MenuType) => {
    dispatch(toggleMenu(menu));
  };

  const handleStyleSelect = (style: MapStyle) => {
    // Delay dispatch to show selection feedback before closing menu
    setTimeout(() => {
      dispatch(setStyle(style));
    }, 300);
  };

  const handleDirectionSelect = (direction: Direction) => {
    // Delay dispatch to show selection feedback before closing menu
    setTimeout(() => {
      dispatch(setDirection(direction));
    }, 300);
  };

  const handleMetricSelect = (metric: Metric) => {
    // Delay dispatch to show selection feedback before closing menu
    setTimeout(() => {
      dispatch(setMetric(metric));
    }, 300);
  };

  const handleVisualizationSelect = (visualization: Visualization) => {
    // Delay dispatch to show selection feedback before closing menu
    setTimeout(() => {
      dispatch(setVisualization(visualization));
    }, 300);
  };

  return {
    openMenu,
    selectedStyle,
    selectedDirection,
    selectedMetric,
    selectedVisualization,
    handleMenuToggle,
    handleStyleSelect,
    handleDirectionSelect,
    handleMetricSelect,
    handleVisualizationSelect,
  };
};
