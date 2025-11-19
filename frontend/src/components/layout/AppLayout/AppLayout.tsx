import { Outlet } from 'react-router-dom';
import { MapBackground } from '../MapBackground/MapBackground';
import { MapProvider } from '@/features/map';

/**
 * Main application layout with persistent map background
 *
 * Renders the map as a fixed background and page content as overlays.
 * All routes render their content via the Outlet component.
 *
 * Layout structure:
 * - MapBackground (z-index: 0, fixed position)
 * - Content container (z-index: 1, relative position)
 *   - Header (future)
 *   - Outlet (current route's page component)
 *
 * @example
 * ```tsx
 * // In router configuration
 * {
 *   path: '/',
 *   element: <AppLayout />,
 *   children: [
 *     { index: true, element: <MapPage /> },
 *     { path: 'analytics', element: <AnalyticsPage /> },
 *   ]
 * }
 * ```
 */
export const AppLayout = () => {
  return (
    <MapProvider>
      {/* Fixed map background */}
      <MapBackground />

      {/* Route content renders here as floating overlays */}
      <Outlet />
    </MapProvider>
  );
};
