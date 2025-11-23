/**
 * Map configuration constants
 */

/**
 * Initial view state for map centered on Helsinki (5km north)
 */
export const INITIAL_VIEW_STATE = {
  longitude: 24.9384, // Helsinki center
  latitude: 60.2149, // 5km north of center
  zoom: 11,
  pitch: 0,
  bearing: 0,
} as const;

/**
 * Map animation and zoom settings
 */
export const MAP_ANIMATION = {
  /** Default zoom level when centering on a station */
  stationCenteringZoom: 13,
  /** Default animation duration in milliseconds */
  defaultDuration: 1000,
  /** Minimum zoom level required to skip centering animation */
  minimumZoomForSkipping: 12,
  /** Duration for compass orientation changes in milliseconds */
  compassDuration: 500,
} as const;
