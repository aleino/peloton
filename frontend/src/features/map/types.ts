/**
 * View state for map positioning and camera
 *
 * Note: This type is kept for reference but react-map-gl's built-in
 * ViewState type should be preferred for new code.
 */
export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;
  bearing?: number;
  padding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}

/**
 * Centralized type definitions for map controls
 *
 * These types are used across map controls, Redux store, and other map-related components.
 */

// Map visual settings
export type MapStyle = 'dark' | 'light' | 'satellite' | 'streets';
export type Visualization = 'points' | 'voronoi';

// Data filter settings
export type Direction = 'departures' | 'arrivals' | 'diff';
export type Metric = 'tripCount' | 'durationAvg' | 'distanceAvg';

// UI state
export type MenuType = 'style' | 'direction' | 'parameter' | 'visualization';

// Re-export UI config types for backward compatibility
export type {
  StyleOption,
  DirectionOption,
  MetricOption,
  VisualizationOption,
} from './components/MapControls/config';
