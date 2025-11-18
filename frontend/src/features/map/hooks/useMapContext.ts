import { useContext } from 'react';
import { MapContext } from '../context/MapContext';

/**
 * Hook to access map context
 *
 * Must be used within a MapProvider component.
 * Provides access to map instance, view state, and control methods.
 *
 * @throws Error if used outside MapProvider
 *
 * @example
 * ```tsx
 * const { mapRef, viewState, flyTo } = useMapContext();
 *
 * // Fly to a station
 * flyTo({ center: [station.lng, station.lat], zoom: 15 });
 * ```
 */
export const useMapContext = () => {
  const context = useContext(MapContext);

  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }

  return context;
};
