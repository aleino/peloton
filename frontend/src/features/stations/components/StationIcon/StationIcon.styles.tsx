import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';
import type { StationIconProps } from './StationIcon';

interface ContainerProps {
  size: number;
  variant: StationIconProps['variant'];
}

const Container = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'size' && prop !== 'variant',
})<ContainerProps>(({ theme, size, variant }) => {
  // Color variants
  const colors = {
    default: {
      background: theme.palette.primary.main,
      icon: theme.palette.primary.contrastText,
      border: theme.palette.primary.dark,
    },
    hover: {
      background: theme.palette.primary.light,
      icon: theme.palette.primary.contrastText,
      border: theme.palette.primary.main,
    },
    active: {
      background: theme.palette.secondary.main,
      icon: theme.palette.secondary.contrastText,
      border: theme.palette.secondary.dark,
    },
  };

  const currentColors = colors[variant || 'default'];

  return {
    width: size,
    height: size,
    borderRadius: '50%',
    backgroundColor: currentColors.background,
    border: `2px solid ${currentColors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: currentColors.icon,
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: theme.shadows[2],

    '&:hover': {
      transform: 'scale(1.1)',
      boxShadow: theme.shadows[4],
    },

    '&:active': {
      transform: 'scale(0.95)',
    },
  };
});

export const Styled = {
  Container,
};
