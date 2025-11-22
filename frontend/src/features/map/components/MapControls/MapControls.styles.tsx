import { styled } from '@mui/material/styles';

const Container = styled('div')(() => ({
  position: 'absolute',
  right: 24,
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 2,
  gap: 16,
  pointerEvents: 'none', // allow map interaction except on controls
  '& .mapboxgl-ctrl': {
    margin: '50vh 24px 0 0',
  },
  '& .mapboxgl-ctrl-group': {
    margin: '50vh 24px 0 0',
  },
}));

const ControlWrapper = styled('div')({
  pointerEvents: 'auto',
});

export const Styled = {
  Container,
  ControlWrapper,
};
