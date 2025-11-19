import { useCallback, type ReactNode } from 'react';
import { Map, type ViewStateChangeEvent } from 'react-map-gl/mapbox';
import { useMapContext } from '../../hooks/useMapContext';
import { MAPBOX_CONFIG, MAP_CONSTRAINTS } from '@/config/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

interface BaseMapProps {
  /** Child components (layers, controls, popups) */
  children?: ReactNode;

  /** Optional additional CSS classes */
  className?: string;

  /** Optional inline styles */
  style?: React.CSSProperties;
}

/**
 * Base map component using react-map-gl
 *
 * Renders the core Mapbox GL JS map with configured settings.
 * Connects to MapContext for state management.
 *
 * @example
 * ```tsx
 * <BaseMap>
 *   <NavigationControl position="top-right" />
 *   <StationsLayer />
 * </BaseMap>
 * ```
 */
export const BaseMap = ({ children, className, style }: BaseMapProps) => {
  const { mapRef, viewState, setViewState } = useMapContext();

  /**
   * Handle map move events (pan, zoom, rotate)
   */
  const handleMove = useCallback(
    (evt: ViewStateChangeEvent) => {
      const { longitude, latitude, zoom, pitch, bearing, padding } = evt.viewState;
      setViewState({ longitude, latitude, zoom, pitch, bearing, padding });
    },
    [setViewState]
  );

  /**
   * Handle map load event
   */
  const handleLoad = useCallback(() => {
    console.log('Map loaded successfully');

    // Optional: Perform additional setup after map loads
    const map = mapRef.current?.getMap();
    if (map) {
      // Example: Add custom map interactions or configurations here
      map.on('error', (e) => {
        console.error('Map error:', e);
      });
    }
  }, [mapRef]);

  /**
   * Handle map errors
   */
  const handleError = useCallback((evt: any) => {
    console.error('Map rendering error:', evt.error);
  }, []);

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={handleMove}
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
      className={className}
      reuseMaps
    >
      {children}
    </Map>
  );
};
