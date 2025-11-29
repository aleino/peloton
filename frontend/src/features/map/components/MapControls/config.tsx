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
  TrendingUp,
  Activity,
  BarChart3,
  BarChart,
  Network,
} from 'lucide-react';
import type { MapStyle, Direction, Metric, Visualization, ColorScale } from '../../types';

// Re-export types for convenience (used by menu components)
export type { MapStyle, Direction, Metric, Visualization, ColorScale };

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

// Color Scales
export interface ColorScaleOption {
  value: ColorScale;
  icon: LucideIcon;
  label: string;
  description: string;
}

export const COLOR_SCALE_OPTIONS: readonly ColorScaleOption[] = [
  {
    value: 'linear',
    icon: TrendingUp,
    label: 'Linear',
    description: 'Even distribution across value range',
  },
  {
    value: 'sqrt',
    icon: Activity,
    label: 'Square Root',
    description: 'Moderate compression of high values (good for count data)',
  },
  {
    value: 'log',
    icon: BarChart3,
    label: 'Logarithmic',
    description: 'Strong compression for highly skewed data',
  },
  {
    value: 'quantile',
    icon: BarChart,
    label: 'Quantile',
    description: 'Equal-sized buckets (deciles)',
  },
  {
    value: 'jenks',
    icon: Network,
    label: 'Smart Clusters',
    description: 'Natural data groupings (intelligent breaks)',
  },
] as const;

export const getColorScaleOption = (value: ColorScale): ColorScaleOption => {
  const option = COLOR_SCALE_OPTIONS.find((opt) => opt.value === value);
  return option ?? COLOR_SCALE_OPTIONS[0]!;
};
