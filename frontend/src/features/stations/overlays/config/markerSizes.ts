/**
 * Marker size and stroke configuration for different interaction states
 *
 * These values are used in Mapbox expressions for dynamic styling.
 * All sizes are in pixels.
 */

/**
 * Circle radius for different states
 */
export const MARKER_RADIUS = {
  /** Default state - no interaction */
  DEFAULT: 14,
  /** Hover state - mouse over marker */
  HOVER: 18,
  /** Selected state - marker is active */
  SELECTED: 22,
} as const;

/**
 * Stroke width for different states
 */
export const MARKER_STROKE_WIDTH = {
  /** Default state - no interaction */
  DEFAULT: 2,
  /** Hover state - mouse over marker */
  HOVER: 3,
  /** Selected state - marker is active */
  SELECTED: 4,
} as const;

/**
 * Transition duration for smooth state changes
 */
export const MARKER_TRANSITION_DURATION = 100; // milliseconds

/**
 * Marker stroke color (consistent across states)
 */
export const MARKER_STROKE_COLOR = '#ffffff'; // White

/**
 * Marker opacity (consistent across states)
 */
export const MARKER_OPACITY = 0.9;
