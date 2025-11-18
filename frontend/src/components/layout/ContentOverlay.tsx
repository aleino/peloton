import { Box, Paper, type SxProps, type Theme } from '@mui/material';
import type { ReactNode } from 'react';

interface ContentOverlayProps {
  /** Content to render in the overlay */
  children: ReactNode;

  /** Position of the overlay */
  position?: {
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;
  };

  /** Width of the overlay */
  width?: number | string;

  /** Maximum width of the overlay */
  maxWidth?: number | string;

  /** Maximum height of the overlay */
  maxHeight?: number | string;

  /** Whether to make the overlay scrollable */
  scrollable?: boolean;

  /** Additional MUI sx props */
  sx?: SxProps<Theme>;
}

/**
 * Reusable overlay container for content above the map
 *
 * Provides a semi-transparent panel with consistent styling
 * for UI elements that float above the map background.
 *
 * @example
 * ```tsx
 * <ContentOverlay
 *   position={{ top: 80, left: 20 }}
 *   width={350}
 *   maxHeight="80vh"
 *   scrollable
 * >
 *   <FilterPanel />
 * </ContentOverlay>
 * ```
 */
export const ContentOverlay = ({
  children,
  position = {},
  width = 'auto',
  maxWidth,
  maxHeight,
  scrollable = false,
  sx = {},
}: ContentOverlayProps) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        ...position,
        zIndex: 10,
        pointerEvents: 'auto',
        ...sx,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width,
          maxWidth,
          maxHeight,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          overflow: scrollable ? 'auto' : 'visible',
          borderRadius: 2,
          p: 2,
        }}
      >
        {children}
      </Paper>
    </Box>
  );
};
