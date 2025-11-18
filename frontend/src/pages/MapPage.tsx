import { FloatingHeader } from '@/components/layout/FloatingHeader';
import { FloatingPanel } from '@/components/layout/FloatingPanel';
import { Typography, Box } from '@mui/material';

/**
 * Main map page with floating UI elements
 *
 * Demonstrates the layout pattern:
 * - FloatingHeader at top
 * - FloatingPanel on left (39% width)
 * - Map remains interactive in all other areas
 */
export const MapPage = () => {
  return (
    <>
      {/* Floating header */}
      <FloatingHeader
        title="Peloton"
        rightContent={
          <Typography variant="body2" color="text.secondary">
            Test Layout
          </Typography>
        }
      />

      {/* Floating left panel */}
      <FloatingPanel position="left" width="39%" top={80} scrollable>
        <Typography variant="h5" gutterBottom>
          Test Panel
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          This is a test panel to verify the layout works correctly. The map should be interactive
          everywhere except under this panel and the header.
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">• Header: Fixed at top</Typography>
          <Typography variant="body2">• Panel: Left side, 39% width</Typography>
          <Typography variant="body2">• Map: Interactive in remaining space</Typography>
        </Box>
      </FloatingPanel>
    </>
  );
};
