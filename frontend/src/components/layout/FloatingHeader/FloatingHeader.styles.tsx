import { AppBar, styled, Toolbar, Box } from '@mui/material';

const StyledAppBar = styled(AppBar)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 100,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  pointerEvents: 'auto',
});

const StyledToolbar = styled(Toolbar)({});

const LeftSection = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
});

const CenterSection = styled(Box)({
  flexGrow: 1,
  display: 'flex',
  justifyContent: 'center',
});

const RightSection = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
});

export const Styled = {
  AppBar: StyledAppBar,
  Toolbar: StyledToolbar,
  LeftSection,
  CenterSection,
  RightSection,
};
