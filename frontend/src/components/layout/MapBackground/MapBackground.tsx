import { BaseMap, MapControls } from '@/features/map';

/**
 * Persistent map background container
 *
 * Renders the map as a fixed background layer that persists
 * across all routes. Uses fixed positioning to stay behind
 * all page content.
 *
 * @example
 * ```tsx
 * <MapBackground />
 * // Map renders at z-index 0, fixed position
 * ```
 */
export const MapBackground = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    >
      <BaseMap>
        <MapControls />
      </BaseMap>
    </div>
  );
};
