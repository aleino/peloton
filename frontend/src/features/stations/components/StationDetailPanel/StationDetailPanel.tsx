import { Box, Typography, Divider, CircularProgress } from '@mui/material';
import { FloatingPanel } from '@/components/layout';
import { StationIcon } from '../StationIcon';
import { StationStats } from '../StationStats';
import { ActivityChart } from '../ActivityChart';
import { useStationDetail } from '../../api/useStationDetail';

export interface StationDetailPanelProps {
  stationId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Station detail panel showing comprehensive station information
 *
 * Uses the FloatingPanel component with built-in close button.
 *
 * Displays:
 * - Station name and icon
 * - Location coordinates
 * - Detailed statistics (departures, arrivals, averages)
 * - Activity charts (busiest hour, busiest day)
 *
 * @example
 * ```tsx
 * <StationDetailPanel
 *   stationId="001"
 *   isOpen={true}
 *   onClose={() => setSelectedStation(null)}
 * />
 * ```
 */
export const StationDetailPanel = ({ stationId, isOpen, onClose }: StationDetailPanelProps) => {
  const {
    data: station,
    isLoading,
    error,
  } = useStationDetail({
    stationId: stationId || '',
    enabled: isOpen && !!stationId,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <FloatingPanel position="left" width="39%" top={80} scrollable closable onClose={onClose}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
        <StationIcon size={48} variant="active" />

        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" gutterBottom>
            {station?.name || 'Loading...'}
          </Typography>

          {station && (
            <Typography variant="body2" color="text.secondary">
              {station.location.coordinates[1].toFixed(4)}°N,{' '}
              {station.location.coordinates[0].toFixed(4)}°E
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Box sx={{ py: 4 }}>
          <Typography color="error" align="center">
            Failed to load station details
          </Typography>
        </Box>
      )}

      {/* Station Content */}
      {station && (
        <>
          {/* Statistics Section */}
          <Typography variant="h6" gutterBottom>
            Statistics
          </Typography>
          <StationStats statistics={station.statistics} />

          <Divider sx={{ my: 3 }} />

          {/* Activity Section */}
          <Typography variant="h6" gutterBottom>
            Activity Patterns
          </Typography>
          <ActivityChart
            busiestHour={station.statistics.busiestHour}
            busiestDay={station.statistics.busiestDay}
          />

          <Divider sx={{ my: 3 }} />

          {/* Additional Info */}
          <Typography variant="body2" color="text.secondary">
            Station ID: {station.stationId}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {new Date(station.updatedAt).toLocaleDateString()}
          </Typography>
        </>
      )}
    </FloatingPanel>
  );
};
