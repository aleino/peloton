import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ColorScaleType = 'linear' | 'log' | 'quantile';

export interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'fi';
  mapStyle: 'light' | 'dark' | 'streets' | 'satellite';
  colorScaleType: ColorScaleType;
  sidebarOpen: boolean;
  visibleLayers: {
    stations: boolean;
    trips: boolean;
    heatmap: boolean;
  };
}

const initialState: SettingsState = {
  theme: 'dark',
  language: 'en',
  mapStyle: 'dark',
  colorScaleType: 'quantile',
  sidebarOpen: true,
  visibleLayers: {
    stations: true,
    trips: false,
    heatmap: false,
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<SettingsState['theme']>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<SettingsState['language']>) => {
      state.language = action.payload;
    },
    setMapStyle: (state, action: PayloadAction<SettingsState['mapStyle']>) => {
      state.mapStyle = action.payload;
    },
    setColorScaleType: (state, action: PayloadAction<ColorScaleType>) => {
      state.colorScaleType = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleLayer: (state, action: PayloadAction<keyof SettingsState['visibleLayers']>) => {
      const layer = action.payload;
      state.visibleLayers[layer] = !state.visibleLayers[layer];
    },
    setVisibleLayers: (state, action: PayloadAction<Partial<SettingsState['visibleLayers']>>) => {
      state.visibleLayers = { ...state.visibleLayers, ...action.payload };
    },
  },
});

export const {
  setTheme,
  setLanguage,
  setMapStyle,
  setColorScaleType,
  toggleSidebar,
  toggleLayer,
  setVisibleLayers,
} = settingsSlice.actions;

export const settingsReducer = settingsSlice.reducer;

// Selectors
export const selectSettings = (state: { settings: SettingsState }) => state.settings;
export const selectTheme = (state: { settings: SettingsState }) => state.settings.theme;
export const selectColorScaleType = (state: { settings: SettingsState }) =>
  state.settings.colorScaleType;
