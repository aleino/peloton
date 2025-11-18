import type { SxProps, Theme } from '@mui/material';
import type { ReactNode } from 'react';
import { Styled } from './ContentOverlay.styles';

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
    <Styled.OverlayContainer
      top={position.top}
      right={position.right}
      bottom={position.bottom}
      left={position.left}
      sx={sx}
    >
      <Styled.Paper
        elevation={3}
        width={width}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        scrollable={scrollable}
      >
        {children}
      </Styled.Paper>
    </Styled.OverlayContainer>
  );
};
