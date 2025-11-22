import { describe, it, expect } from 'vitest';
import {
  settingsReducer,
  setTheme,
  setLanguage,
  setMapStyle,
  setColorScaleType,
  toggleSidebar,
  toggleLayer,
  setVisibleLayers,
  selectSettings,
  selectColorScaleType,
  type SettingsState,
} from './settings.store';
describe('settingsSlice', () => {
  describe('reducers', () => {
    it('should return initial state', () => {
      const state = settingsReducer(undefined, { type: '@@INIT' });
      expect(state).toEqual({
        theme: 'light',
        language: 'en',
        mapStyle: 'light',
        colorScaleType: 'quantile',
        sidebarOpen: true,
        visibleLayers: {
          stations: true,
          trips: false,
          heatmap: false,
        },
      });
    });

    it('should set theme', () => {
      const state = settingsReducer(undefined, setTheme('dark'));
      expect(state.theme).toBe('dark');
    });

    it('should set language', () => {
      const state = settingsReducer(undefined, setLanguage('fi'));
      expect(state.language).toBe('fi');
    });

    it('should set map style', () => {
      const state = settingsReducer(undefined, setMapStyle('satellite'));
      expect(state.mapStyle).toBe('satellite');
    });

    it('should set color scale type', () => {
      const state1 = settingsReducer(undefined, setColorScaleType('linear'));
      expect(state1.colorScaleType).toBe('linear');

      const state2 = settingsReducer(state1, setColorScaleType('log'));
      expect(state2.colorScaleType).toBe('log');

      const state3 = settingsReducer(state2, setColorScaleType('quantile'));
      expect(state3.colorScaleType).toBe('quantile');
    });

    it('should toggle sidebar', () => {
      const state1 = settingsReducer(undefined, toggleSidebar());
      expect(state1.sidebarOpen).toBe(false);

      const state2 = settingsReducer(state1, toggleSidebar());
      expect(state2.sidebarOpen).toBe(true);
    });

    it('should toggle individual layer', () => {
      const state1 = settingsReducer(undefined, toggleLayer('stations'));
      expect(state1.visibleLayers.stations).toBe(false);

      const state2 = settingsReducer(state1, toggleLayer('trips'));
      expect(state2.visibleLayers.trips).toBe(true);
      expect(state2.visibleLayers.stations).toBe(false); // Previous toggle remains
    });

    it('should set visible layers', () => {
      const state = settingsReducer(
        undefined,
        setVisibleLayers({ stations: false, heatmap: true })
      );
      expect(state.visibleLayers.stations).toBe(false);
      expect(state.visibleLayers.heatmap).toBe(true);
      expect(state.visibleLayers.trips).toBe(false); // Unchanged from initial state
    });
  });

  describe('selectors', () => {
    const mockState = {
      settings: {
        theme: 'dark' as const,
        language: 'fi' as const,
        mapStyle: 'satellite' as const,
        colorScaleType: 'log' as const,
        sidebarOpen: false,
        visibleLayers: {
          stations: true,
          trips: true,
          heatmap: false,
        },
      } as SettingsState,
    };

    it('should select all settings', () => {
      const settings = selectSettings(mockState);
      expect(settings.theme).toBe('dark');
      expect(settings.language).toBe('fi');
      expect(settings.mapStyle).toBe('satellite');
      expect(settings.colorScaleType).toBe('log');
      expect(settings.sidebarOpen).toBe(false);
      expect(settings.visibleLayers).toEqual({
        stations: true,
        trips: true,
        heatmap: false,
      });
    });

    it('should select color scale type', () => {
      const colorScaleType = selectColorScaleType(mockState);
      expect(colorScaleType).toBe('log');
    });
  });
});
