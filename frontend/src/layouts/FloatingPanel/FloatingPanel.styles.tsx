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
  [panelPosition]: '0.5rem',
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
})<StyledPaperProps>(({ theme, scrollable }) => ({
  height: '100%',
  // @ts-expect-error - Custom glassmorphism extension
  ...theme.palette.glassmorphism,
  borderRadius: 16,
  overflow: scrollable ? 'auto' : 'visible',
  display: 'flex',
  flexDirection: 'column',
}));

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  padding: theme.spacing(3),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const HeaderContent = styled(Box)({
  flex: 1,
  minWidth: 0, // Allow text truncation
});

interface ContentContainerProps {
  hasHeader: boolean;
}

const ContentContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'hasHeader',
})<ContentContainerProps>(({ theme, hasHeader }) => ({
  padding: hasHeader ? theme.spacing(3) : theme.spacing(1, 3, 3),
  flex: 1,
}));

export const Styled = {
  PanelContainer,
  Paper: StyledPaper,
  HeaderContainer,
  HeaderContent,
  ContentContainer,
};
