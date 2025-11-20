import type { MapOptions } from 'react-map-gl/mapbox';
import { env } from './env';

/**
 * Initial view state for map centered on Helsinki
 */
export const INITIAL_VIEW_STATE = {
  longitude: 24.9384, // Helsinki center
  latitude: 60.1699,
  zoom: 11,
  pitch: 0,
  bearing: 0,
} as const;

/**
 * Available Mapbox map styles
 */
export const MAP_STYLES = {
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  streets: 'mapbox://styles/mapbox/streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
} as const;

export type MapStyleKey = keyof typeof MAP_STYLES;

/**
 * Default map style for the application
 */
export const DEFAULT_MAP_STYLE: MapStyleKey = 'dark';

/**
 * Mapbox GL JS configuration options
 */
export const MAPBOX_CONFIG = {
  accessToken: env.VITE_MAPBOX_TOKEN,
  defaultStyle: MAP_STYLES[DEFAULT_MAP_STYLE],
  initialViewState: INITIAL_VIEW_STATE,
  mapOptions: {
    attributionControl: true,
    logoPosition: 'bottom-left' as const,
    cooperativeGestures: false, // Allow single-finger pan
    touchPitch: false, // Disable pitch on mobile
    touchZoomRotate: true,
  } satisfies Partial<MapOptions>,
} as const;

/**
 * Map bounds for Helsinki region (prevents panning too far)
 */
export const HELSINKI_BOUNDS: [[number, number], [number, number]] = [
  [24.6, 60.0], // Southwest coordinates
  [25.3, 60.4], // Northeast coordinates
];

/**
 * Default map constraints
 */
export const MAP_CONSTRAINTS = {
  minZoom: 9,
  maxZoom: 18,
  maxBounds: HELSINKI_BOUNDS,
} as const;
