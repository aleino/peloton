import { styled } from '@mui/material/styles';
import { Box, IconButton } from '@mui/material';

const Container = styled(Box)(() => ({
  position: 'absolute',
  right: 16,
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  alignItems: 'flex-end',
  zIndex: 2,
  pointerEvents: 'none',
}));

const ControlPanel = styled(Box)(({ theme }) => ({
  padding: 10,
  borderRadius: 999,
  background: theme.palette.mode === 'dark' ? 'rgba(5, 8, 22, 0.15)' : 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  border: `1px solid ${
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'
  }`,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  pointerEvents: 'auto',
}));

const ZoomPanel = styled(ControlPanel)(() => ({}));

const SecondaryPanel = styled(ControlPanel)(() => ({}));

const ZoomButton = styled(IconButton)(({ theme }) => ({
  width: 56,
  height: 56,
  borderRadius: 999,
  border: `1px solid ${
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'
  }`,
  background:
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : theme.palette.text.primary,
  '&:hover': {
    background:
      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.3)',
    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)',
  },
}));

const SecondaryButton = styled(IconButton)(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: 999,
  border: `1px solid ${
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.18)'
  }`,
  background:
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.1)',
  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : theme.palette.text.secondary,
  '&:hover': {
    background:
      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.25)',
    borderColor:
      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.25)',
    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : theme.palette.text.primary,
  },
}));

export const Styled = {
  Container,
  ZoomPanel,
  SecondaryPanel,
  ZoomButton,
  SecondaryButton,
};
