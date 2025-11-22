import { IconButton, type SxProps, type Theme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { ReactNode } from 'react';
import { Styled } from './FloatingPanel.styles';

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

  /** Optional header content (title, etc.) */
  header?: ReactNode;

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
  header,
  sx = {},
}: FloatingPanelProps) => {
  return (
    <Styled.PanelContainer
      panelPosition={position}
      width={width}
      top={top}
      maxHeight={maxHeight}
      sx={sx}
    >
      <Styled.Paper elevation={3} scrollable={scrollable}>
        {/* Header with optional close button */}
        {(header || closable) && (
          <Styled.HeaderContainer>
            <Styled.HeaderContent>{header}</Styled.HeaderContent>
            {closable && (
              <IconButton
                size="small"
                onClick={onClose}
                aria-label="Close panel"
                sx={{ flexShrink: 0 }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </Styled.HeaderContainer>
        )}

        {/* Panel content */}
        <Styled.ContentContainer hasHeader={!!(header || closable)}>
          {children}
        </Styled.ContentContainer>
      </Styled.Paper>
    </Styled.PanelContainer>
  );
};
