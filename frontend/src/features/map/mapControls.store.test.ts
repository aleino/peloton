import { describe, it, expect } from 'vitest';
import {
  mapControlsReducer,
  setColorScale,
  selectColorScale,
  type MapControlsState,
} from './mapControls.store';
import type { ColorScale } from './types';

describe('mapControls.store - colorScale', () => {
  const initialState: MapControlsState = {
    style: 'dark',
    visualization: 'points',
    colorScale: 'quantile',
    direction: 'departures',
    metric: 'tripCount',
    openMenu: null,
  };

  it('should set initial color scale to quantile', () => {
    expect(initialState.colorScale).toBe('quantile');
  });

  it('should update color scale when setColorScale is dispatched', () => {
    const state = mapControlsReducer(initialState, setColorScale('sqrt'));
    expect(state.colorScale).toBe('sqrt');
  });

  it('should close menu when color scale is selected', () => {
    const stateWithOpenMenu: MapControlsState = {
      ...initialState,
      openMenu: 'colorScale',
    };

    const newState = mapControlsReducer(stateWithOpenMenu, setColorScale('log'));

    expect(newState.colorScale).toBe('log');
    expect(newState.openMenu).toBe(null);
  });

  it('should handle all valid color scale types', () => {
    const scales: ColorScale[] = ['linear', 'sqrt', 'log', 'quantile'];

    scales.forEach((scale) => {
      const state = mapControlsReducer(initialState, setColorScale(scale));
      expect(state.colorScale).toBe(scale);
    });
  });

  it('should preserve other state when setting color scale', () => {
    const customState: MapControlsState = {
      ...initialState,
      style: 'satellite',
      metric: 'durationAvg',
      direction: 'arrivals',
    };

    const newState = mapControlsReducer(customState, setColorScale('linear'));

    expect(newState.style).toBe('satellite');
    expect(newState.metric).toBe('durationAvg');
    expect(newState.direction).toBe('arrivals');
    expect(newState.colorScale).toBe('linear');
  });

  describe('selectColorScale', () => {
    it('should select color scale from state', () => {
      const state = {
        map: {
          controls: initialState,
        },
      };

      const colorScale = selectColorScale(state);
      expect(colorScale).toBe('quantile');
    });

    it('should return updated color scale after change', () => {
      const state = {
        map: {
          controls: mapControlsReducer(initialState, setColorScale('sqrt')),
        },
      };

      const colorScale = selectColorScale(state);
      expect(colorScale).toBe('sqrt');
    });
  });
});
