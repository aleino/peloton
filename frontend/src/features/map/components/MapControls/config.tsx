import type { LucideIcon } from 'lucide-react';
import {
  Map,
  Satellite,
  Sun,
  Moon,
  ArrowUpRight,
  ArrowDown,
  ArrowRightLeft,
  Hash,
  Timer,
  Ruler,
  CircleDot,
  Hexagon,
} from 'lucide-react';
import type { MapStyle, Direction, Metric, Visualization } from '../../types';

// Re-export types for convenience (used by menu components)
export type { MapStyle, Direction, Metric, Visualization };

// Icon sizes
export const CONTROL_BUTTON_ICON_SIZE = 22;
export const MENU_OPTION_ICON_SIZE = 32;

// Map Styles

export interface StyleOption {
  value: MapStyle;
  icon: LucideIcon;
  label: string;
}

export const STYLE_OPTIONS: readonly StyleOption[] = [
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'satellite', icon: Satellite, label: 'Satellite' },
  { value: 'streets', icon: Map, label: 'Streets' },
] as const;

// Trip Directions
export interface DirectionOption {
  value: Direction;
  icon: LucideIcon;
  label: string;
}

export const DIRECTION_OPTIONS: readonly DirectionOption[] = [
  { value: 'departures', icon: ArrowUpRight, label: 'Departures' },
  { value: 'arrivals', icon: ArrowDown, label: 'Arrivals' },
  { value: 'diff', icon: ArrowRightLeft, label: 'Difference' },
] as const;

// Trip Metrics
export interface MetricOption {
  value: Metric;
  icon: LucideIcon;
  label: string;
}

export const METRIC_OPTIONS: readonly MetricOption[] = [
  { value: 'tripCount', icon: Hash, label: 'Total Trips' },
  { value: 'durationAvg', icon: Timer, label: 'Duration' },
  { value: 'distanceAvg', icon: Ruler, label: 'Distance' },
] as const;

// Visualizations
export interface VisualizationOption {
  value: Visualization;
  icon: LucideIcon;
  label: string;
}

export const VISUALIZATION_OPTIONS: readonly VisualizationOption[] = [
  { value: 'points', icon: CircleDot, label: 'Points' },
  { value: 'voronoi', icon: Hexagon, label: 'Voronoi' },
] as const;

// Helper functions to get current option by value
export const getStyleOption = (value: MapStyle): StyleOption => {
  const option = STYLE_OPTIONS.find((opt) => opt.value === value);
  return option ?? STYLE_OPTIONS[0]!;
};

export const getDirectionOption = (value: Direction): DirectionOption => {
  const option = DIRECTION_OPTIONS.find((opt) => opt.value === value);
  return option ?? DIRECTION_OPTIONS[0]!;
};

export const getMetricOption = (value: Metric): MetricOption => {
  const option = METRIC_OPTIONS.find((opt) => opt.value === value);
  return option ?? METRIC_OPTIONS[0]!;
};

export const getVisualizationOption = (value: Visualization): VisualizationOption => {
  const option = VISUALIZATION_OPTIONS.find((opt) => opt.value === value);
  return option ?? VISUALIZATION_OPTIONS[0]!;
};
