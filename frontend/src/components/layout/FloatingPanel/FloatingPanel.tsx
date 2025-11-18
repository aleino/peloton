import { Paper, Box, IconButton, type SxProps, type Theme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { ReactNode } from 'react';

interface FloatingPanelProps {
  /** Panel content */
  children: ReactNode;

  /** Panel position */
  position?: 'left' | 'right';

  /** Width of panel (default: 39%) */
  width?: string | number;

  /** Top offset (to clear header) */
  top?: string | number;

  /** Maximum height */
  maxHeight?: string;

  /** Whether panel is scrollable */
  scrollable?: boolean;

  /** Whether to show close button */
  closable?: boolean;

  /** Close button handler */
  onClose?: () => void;

  /** Additional sx props */
  sx?: SxProps<Theme>;
}

/**
 * Floating side panel that doesn't block map interactions
 *
 * Renders as an absolutely positioned panel on left or right side.
 * Map remains interactive in the remaining space.
 *
 * @example
 * ```tsx
 * <FloatingPanel
 *   position="left"
 *   width="39%"
 *   top={80}
 *   scrollable
 * >
 *   <FilterControls />
 * </FloatingPanel>
 * ```
 */
export const FloatingPanel = ({
  children,
  position = 'left',
  width = '39%',
  top = 80,
  maxHeight = 'calc(100vh - 96px)',
  scrollable = true,
  closable = false,
  onClose,
  sx = {},
}: FloatingPanelProps) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        [position]: 16,
        top,
        width,
        maxWidth: 600, // Prevent too wide on large screens
        minWidth: 300, // Prevent too narrow
        maxHeight,
        zIndex: 50,
        pointerEvents: 'auto',
        ...sx,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          overflow: scrollable ? 'auto' : 'visible',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Close button if closable */}
        {closable && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              p: 1,
            }}
          >
            <IconButton size="small" onClick={onClose} aria-label="Close panel">
              <CloseIcon />
            </IconButton>
          </Box>
        )}

        {/* Panel content */}
        <Box sx={{ p: 3, flex: 1 }}>{children}</Box>
      </Paper>
    </Box>
  );
};
