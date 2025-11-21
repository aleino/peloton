import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';
import type { StationIconProps } from './StationIcon';

interface ContainerProps {
  size: number;
  variant: StationIconProps['variant'];
}

const Container = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'size' && prop !== 'variant',
})<ContainerProps>(({ size }) => ({
  width: size,
  height: size,
  borderRadius: '50%',
  backgroundColor: 'transparent',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#FFFFFF',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',

  '&:hover': {
    transform: 'scale(1.1)',
  },

  '&:active': {
    transform: 'scale(0.95)',
  },
}));

export const Styled = {
  Container,
};
