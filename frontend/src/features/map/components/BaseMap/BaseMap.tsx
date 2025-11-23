import { useCallback, type ReactNode } from 'react';
import { Map, type ErrorEvent } from 'react-map-gl/mapbox';
import { MAPBOX_CONFIG, MAP_CONSTRAINTS } from '@/config/mapbox';
import { INITIAL_VIEW_STATE } from '@/features/map/map.config';
import 'mapbox-gl/dist/mapbox-gl.css';

interface BaseMapProps {
  /** Child components (layers, controls, popups) */
  children?: ReactNode;

  /** Optional inline styles */
  style?: React.CSSProperties;
}

/**
 * Base map component using react-map-gl
 *
 * Renders the core Mapbox GL JS map with configured settings.
 * Uses react-map-gl's MapProvider for map instance access.
 *
 * @example
 * ```tsx
 * <BaseMap>
 *   <NavigationControl position="top-right" />
 *   <StationsLayer />
 * </BaseMap>
 * ```
 */
export const BaseMap = ({ children, style }: BaseMapProps) => {
  /**
   * Handle map load event
   */
  const handleLoad = useCallback(() => {
    console.log('Map loaded successfully');
  }, []);

  /**
   * Handle map errors
   */
  const handleError = useCallback((evt: ErrorEvent) => {
    console.error('Map rendering error:', evt.error);
  }, []);

  return (
    <Map
      id="main"
      initialViewState={INITIAL_VIEW_STATE}
      onLoad={handleLoad}
      onError={handleError}
      mapStyle={MAPBOX_CONFIG.defaultStyle}
      mapboxAccessToken={MAPBOX_CONFIG.accessToken}
      minZoom={MAP_CONSTRAINTS.minZoom}
      maxZoom={MAP_CONSTRAINTS.maxZoom}
      maxBounds={MAP_CONSTRAINTS.maxBounds}
      {...MAPBOX_CONFIG.mapOptions}
      style={{
        width: '100%',
        height: '100%',
        ...style,
      }}
      reuseMaps
    >
      {children}
    </Map>
  );
};
