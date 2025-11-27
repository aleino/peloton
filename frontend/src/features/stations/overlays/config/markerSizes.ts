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
 * Transition durations for different animation types
 *
 * Organized by use case:
 * - INTERACTION: Fast transitions for hover/selection states (snappy feel)
 * - LAYER_OPACITY: Smooth transitions for layer visibility changes (cross-fade effect)
 * - COLOR_SCALE: Color transitions when changing metrics (smooth color morphing)
 */
export const TRANSITION_DURATION = {
  /** Fast transitions for hover/selection states */
  INTERACTION: 100,
  /** Smooth transitions for layer visibility changes */
  LAYER_OPACITY: 200,
  /** Color scale transitions when changing metrics */
  COLOR_SCALE: 300,
} as const;

/**
 * @deprecated Use TRANSITION_DURATION.INTERACTION instead
 */
export const MARKER_TRANSITION_DURATION = TRANSITION_DURATION.INTERACTION;

/**
 * @deprecated Use TRANSITION_DURATION.LAYER_OPACITY instead
 */
export const FILL_OPACITY_TRANSITION_DURATION = TRANSITION_DURATION.LAYER_OPACITY;

/**
 * Marker stroke color (consistent across states)
 */
export const MARKER_STROKE_COLOR = '#ffffff'; // White

/**
 * Marker opacity (consistent across states)
 */
export const MARKER_OPACITY = 0.9;
