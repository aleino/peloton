import { Box, Typography, Paper, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import { TrendingUp, TrendingDown, Clock, MapPin } from 'lucide-react';
import type { StationStatistics } from '@peloton/shared';

interface StationStatsProps {
  statistics: StationStatistics;
}

const StatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
}));

const StatIcon = styled(Box)(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
}));

const StatContent = styled(Box)({
  flex: 1,
});

const StatValue = styled(Typography)(() => ({
  fontWeight: 600,
  fontSize: '1.25rem',
  lineHeight: 1.2,
}));

const StatLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
}));

/**
 * Station statistics display component
 *
 * Shows key metrics in card format with icons.
 *
 * @example
 * ```tsx
 * <StationStats statistics={station.statistics} />
 * ```
 */
export const StationStats = ({ statistics }: StationStatsProps) => {
  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const formatDistance = (meters: number) => {
    return meters < 1000
      ? `${Math.round(meters).toLocaleString('fi-FI')} m`
      : `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <StatCard elevation={1}>
          <StatIcon>
            <TrendingUp size={20} />
          </StatIcon>
          <StatContent>
            <StatValue>{statistics.totalDepartures.toLocaleString('fi-FI')}</StatValue>
            <StatLabel>Departures</StatLabel>
          </StatContent>
        </StatCard>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <StatCard elevation={1}>
          <StatIcon>
            <TrendingDown size={20} />
          </StatIcon>
          <StatContent>
            <StatValue>{statistics.totalArrivals.toLocaleString('fi-FI')}</StatValue>
            <StatLabel>Arrivals</StatLabel>
          </StatContent>
        </StatCard>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <StatCard elevation={1}>
          <StatIcon>
            <Clock size={20} />
          </StatIcon>
          <StatContent>
            <StatValue>{formatDuration(statistics.avgTripDurationSeconds)}</StatValue>
            <StatLabel>Avg Duration</StatLabel>
          </StatContent>
        </StatCard>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <StatCard elevation={1}>
          <StatIcon>
            <MapPin size={20} />
          </StatIcon>
          <StatContent>
            <StatValue>{formatDistance(statistics.avgTripDistanceMeters)}</StatValue>
            <StatLabel>Avg Distance</StatLabel>
          </StatContent>
        </StatCard>
      </Grid>
    </Grid>
  );
};
