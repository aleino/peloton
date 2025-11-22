import { styled, Box, Paper } from '@mui/material';

const StyledAppBar = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '0.5rem',
  left: '0.5rem',
  right: '0.5rem',
  zIndex: 100,
  // @ts-expect-error - Custom glassmorphism extension
  ...theme.palette.glassmorphism,
  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)', // Minimal elevation
  borderBottom:
    theme.palette.mode === 'light'
      ? '1px solid rgba(255, 255, 255, 0.18)'
      : '1px solid rgba(255, 255, 255, 0.1)',
  pointerEvents: 'auto',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
}));

const StyledToolbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: theme.spacing(1, 2),
  minHeight: '48px',
}));

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
