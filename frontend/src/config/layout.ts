/**
 * Layout dimensions for calculating visible map area
 * Values should match FloatingHeader and FloatingPanel configurations
 */
export const LAYOUT_DIMENSIONS = {
  header: {
    height: 64, // FloatingHeader height + margins
    topMargin: 8, // 0.5rem = 8px
  },
  panel: {
    widthPercent: 39, // FloatingPanel default width
    leftMargin: 8, // 0.5rem = 8px
    rightMargin: 8,
  },
} as const;

/**
 * Calculate map padding to account for UI overlays
 *
 * Returns padding object for Mapbox camera methods that ensures
 * the center point is in the visible (non-overlaid) map area.
 *
 * @param panelPosition - Position of the floating panel ('left' | 'right' | 'none')
 * @param panelWidthPercent - Width of panel as percentage (default: 39)
 * @param viewportWidth - Current viewport width in pixels
 * @returns Padding object for Mapbox camera options
 */
export function calculateMapPadding(
  panelPosition: 'left' | 'right' | 'none',
  panelWidthPercent: number = LAYOUT_DIMENSIONS.panel.widthPercent,
  viewportWidth: number
): { top: number; bottom: number; left: number; right: number } {
  const headerHeight = LAYOUT_DIMENSIONS.header.height;
  const panelWidth = (viewportWidth * panelWidthPercent) / 100;

  return {
    top: headerHeight,
    bottom: 0,
    left: panelPosition === 'left' ? panelWidth : 0,
    right: panelPosition === 'right' ? panelWidth : 0,
  };
}
