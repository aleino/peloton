import { Box, Paper, styled } from '@mui/material';

interface OverlayContainerProps {
  top?: number | string | undefined;
  right?: number | string | undefined;
  bottom?: number | string | undefined;
  left?: number | string | undefined;
}

const OverlayContainer = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== 'top' && prop !== 'right' && prop !== 'bottom' && prop !== 'left',
})<OverlayContainerProps>(({ top, right, bottom, left }) => ({
  position: 'absolute',
  top,
  right,
  bottom,
  left,
  zIndex: 10,
  pointerEvents: 'auto',
}));

interface StyledPaperProps {
  width: number | string;
  maxWidth?: number | string | undefined;
  maxHeight?: number | string | undefined;
  scrollable: boolean;
}

const StyledPaper = styled(Paper, {
  shouldForwardProp: (prop) =>
    prop !== 'width' && prop !== 'maxWidth' && prop !== 'maxHeight' && prop !== 'scrollable',
})<StyledPaperProps>(({ theme, width, maxWidth, maxHeight, scrollable }) => ({
  width,
  maxWidth,
  maxHeight,
  backgroundColor: theme.palette.background.paper,
  backdropFilter: 'blur(10px)',
  overflow: scrollable ? 'auto' : 'visible',
  borderRadius: 8,
  padding: 16,
}));

export const Styled = {
  OverlayContainer,
  Paper: StyledPaper,
};
