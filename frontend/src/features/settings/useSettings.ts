import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectSettings,
  setTheme,
  setLanguage,
  setMapStyle,
  toggleSidebar,
  toggleLayer,
  setVisibleLayers,
} from './settings.store';

export const useSettings = () => {
  const dispatch = useAppDispatch();
  const { theme, language, mapStyle, sidebarOpen, visibleLayers } =
    useAppSelector(selectSettings);

  return {
    theme,
    language,
    mapStyle,
    sidebarOpen,
    visibleLayers,
    setTheme: (theme: 'light' | 'dark' | 'system') => dispatch(setTheme(theme)),
    setLanguage: (language: 'en' | 'fi') => dispatch(setLanguage(language)),
    setMapStyle: (mapStyle: 'light' | 'dark' | 'streets' | 'satellite') =>
      dispatch(setMapStyle(mapStyle)),
    toggleSidebar: () => dispatch(toggleSidebar()),
    toggleLayer: (layer: 'stations' | 'trips' | 'heatmap') => dispatch(toggleLayer(layer)),
    setVisibleLayers: (layers: Partial<{ stations: boolean; trips: boolean; heatmap: boolean }>) =>
      dispatch(setVisibleLayers(layers)),
  };
};
