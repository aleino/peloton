import { Outlet } from 'react-router-dom';
import { MapBackground } from './MapBackground';
import { Box } from '@mui/material';

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
    <>
      {/* Fixed map background */}
      <MapBackground />

      {/* Content overlay container */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          pointerEvents: 'none', // Allow map interactions by default
          '& > *': {
            pointerEvents: 'auto', // Re-enable for content
          },
        }}
      >
        {/* Header will be added in Phase 4 */}

        {/* Page content renders here */}
        <Box component="main" sx={{ width: '100%', height: '100%' }}>
          <Outlet />
        </Box>
      </Box>
    </>
  );
};
