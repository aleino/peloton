import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setStyle,
  setVisualization,
  setColorScale,
  setDirection,
  setMetric,
  toggleMenu,
  selectMapStyle,
  selectVisualization,
  selectColorScale,
  selectDirection,
  selectMetric,
  selectOpenMenu,
} from '@/features/map/mapControls.store';
import type { MapStyle, Direction, Metric, Visualization, ColorScale, MenuType } from '../../types';

/**
 * Hook for managing map control state via Redux
 *
 * Provides state and handlers for map controls including:
 * - Map style selection (dark, light, satellite, streets)
 * - Trip direction filtering (departures, arrivals, diff)
 * - Trip metric selection (tripCount, durationAvg, distanceAvg)
 * - Visualization type (points, voronoi)
 * - Color scale selection (linear, sqrt, log, quantile)
 * - Menu UI state (which submenu is open)
 */
export const useControlMenus = () => {
  const dispatch = useAppDispatch();

  // Select state from Redux
  const openMenu = useAppSelector(selectOpenMenu);
  const selectedStyle = useAppSelector(selectMapStyle);
  const selectedDirection = useAppSelector(selectDirection);
  const selectedMetric = useAppSelector(selectMetric);
  const selectedVisualization = useAppSelector(selectVisualization);
  const selectedColorScale = useAppSelector(selectColorScale);

  const handleMenuToggle = (menu: MenuType) => {
    dispatch(toggleMenu(menu));
  };

  const handleStyleSelect = (style: MapStyle) => {
    dispatch(setStyle(style));
  };

  const handleDirectionSelect = (direction: Direction) => {
    dispatch(setDirection(direction));
  };

  const handleMetricSelect = (metric: Metric) => {
    dispatch(setMetric(metric));
  };

  const handleVisualizationSelect = (visualization: Visualization) => {
    dispatch(setVisualization(visualization));
  };

  const handleColorScaleSelect = (colorScale: ColorScale) => {
    dispatch(setColorScale(colorScale));
  };

  return {
    openMenu,
    selectedStyle,
    selectedDirection,
    selectedMetric,
    selectedVisualization,
    selectedColorScale,
    handleMenuToggle,
    handleStyleSelect,
    handleDirectionSelect,
    handleMetricSelect,
    handleVisualizationSelect,
    handleColorScaleSelect,
  };
};
