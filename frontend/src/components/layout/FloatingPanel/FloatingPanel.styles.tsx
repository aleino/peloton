import { Box, Paper, styled } from '@mui/material';

interface PanelContainerProps {
  panelPosition: 'left' | 'right';
  width: string | number;
  top: string | number;
  maxHeight: string;
}

const PanelContainer = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== 'panelPosition' && prop !== 'width' && prop !== 'top' && prop !== 'maxHeight',
})<PanelContainerProps>(({ panelPosition, width, top, maxHeight }) => ({
  position: 'absolute',
  [panelPosition]: 16,
  top,
  width,
  maxWidth: 600,
  minWidth: 300,
  maxHeight,
  zIndex: 50,
  pointerEvents: 'auto',
}));

interface StyledPaperProps {
  scrollable: boolean;
}

const StyledPaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'scrollable',
})<StyledPaperProps>(({ scrollable }) => ({
  height: '100%',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: 8,
  overflow: scrollable ? 'auto' : 'visible',
  display: 'flex',
  flexDirection: 'column',
}));

const CloseButtonContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-end',
  padding: 8,
});

const ContentContainer = styled(Box)({
  padding: 24,
  flex: 1,
});

export const Styled = {
  PanelContainer,
  Paper: StyledPaper,
  CloseButtonContainer,
  ContentContainer,
};
