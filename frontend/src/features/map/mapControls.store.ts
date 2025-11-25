import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import type { MapStyle, Direction, Metric, Visualization, MenuType } from './types';

/**
 * Redux state for map controls
 */
export interface MapControlsState {
  // Visual settings
  style: MapStyle;
  visualization: Visualization;

  // Data settings
  direction: Direction;
  metric: Metric;

  // UI state
  openMenu: MenuType | null;
}

/**
 * Initial state for map controls
 * Matches the previous default values from useControlMenus hook
 */
const initialState: MapControlsState = {
  style: 'dark',
  visualization: 'points',
  direction: 'departures',
  metric: 'tripCount',
  openMenu: null,
};

/**
 * Redux slice for map controls state management
 *
 * Handles map style, visualization type, data direction/metric selection,
 * and menu UI state.
 */
const mapControlsSlice = createSlice({
  name: 'mapControls',
  initialState,
  reducers: {
    /**
     * Set map style (dark, light, satellite, streets)
     * Closes the menu after selection
     */
    setStyle: (state, action: PayloadAction<MapStyle>) => {
      state.style = action.payload;
      state.openMenu = null;
    },

    /**
     * Set visualization type (points, voronoi)
     * Closes the menu after selection
     */
    setVisualization: (state, action: PayloadAction<Visualization>) => {
      state.visualization = action.payload;
      state.openMenu = null;
    },

    /**
     * Set trip direction (departures, arrivals, diff)
     * Closes the menu after selection
     */
    setDirection: (state, action: PayloadAction<Direction>) => {
      state.direction = action.payload;
      state.openMenu = null;
    },

    /**
     * Set data metric (totalTrips, avgDuration, avgDistance)
     * Closes the menu after selection
     */
    setMetric: (state, action: PayloadAction<Metric>) => {
      state.metric = action.payload;
      state.openMenu = null;
    },

    /**
     * Toggle menu open/closed state
     * If menu is already open, closes it. Otherwise opens the specified menu.
     */
    toggleMenu: (state, action: PayloadAction<MenuType>) => {
      state.openMenu = state.openMenu === action.payload ? null : action.payload;
    },

    /**
     * Close any open menu
     */
    closeMenu: (state) => {
      state.openMenu = null;
    },

    /**
     * Bulk update map controls (useful for URL sync)
     * Does not affect openMenu state
     */
    setMapControls: (state, action: PayloadAction<Partial<Omit<MapControlsState, 'openMenu'>>>) => {
      Object.assign(state, action.payload);
    },
  },
});

// Export actions
export const {
  setStyle,
  setVisualization,
  setDirection,
  setMetric,
  toggleMenu,
  closeMenu,
  setMapControls,
} = mapControlsSlice.actions;

// Export reducer
export const mapControlsReducer = mapControlsSlice.reducer;

// Selectors
export const selectMapStyle = (state: { map: { controls: MapControlsState } }) =>
  state.map.controls.style;
export const selectVisualization = (state: { map: { controls: MapControlsState } }) =>
  state.map.controls.visualization;
export const selectDirection = (state: { map: { controls: MapControlsState } }) =>
  state.map.controls.direction;
export const selectMetric = (state: { map: { controls: MapControlsState } }) =>
  state.map.controls.metric;
export const selectOpenMenu = (state: { map: { controls: MapControlsState } }) =>
  state.map.controls.openMenu;

// Combined selector for all map controls (useful for URL sync)
// Memoized to prevent unnecessary re-renders
export const selectMapControls = createSelector(
  [
    (state: { map: { controls: MapControlsState } }) => state.map.controls.style,
    (state: { map: { controls: MapControlsState } }) => state.map.controls.visualization,
    (state: { map: { controls: MapControlsState } }) => state.map.controls.direction,
    (state: { map: { controls: MapControlsState } }) => state.map.controls.metric,
  ],
  (style, visualization, direction, metric) => ({
    style,
    visualization,
    direction,
    metric,
  })
);
