import { styled, Box, Typography } from '@mui/material';

const ContentWrapper = styled(Box)({
  minHeight: 800,
});

const HeaderContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  minWidth: 0, // Allow text truncation
}));

const StationName = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 700,
  lineHeight: 1.2,
  color: theme.palette.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const Coordinates = styled(Typography)(({ theme }) => ({
  fontSize: '0.8125rem',
  color: theme.palette.text.secondary,
  lineHeight: 1.4,
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const ErrorContainer = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

export const Styled = {
  ContentWrapper,
  HeaderContent,
  StationName,
  Coordinates,
  LoadingContainer,
  ErrorContainer,
};
