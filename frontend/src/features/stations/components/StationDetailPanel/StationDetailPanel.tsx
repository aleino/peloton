import { Typography, Divider, LinearProgress, Box } from '@mui/material';
import { FloatingPanel } from '@/layouts';
import { StationStats } from '../StationStats';
import { ActivityChart } from '../ActivityChart';
import { useStationDetail } from '../../api/useStationDetail';
import { Styled } from './StationDetailPanel.styles';

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
    isFetching,
    error,
  } = useStationDetail({
    stationId: stationId || '',
    enabled: isOpen && !!stationId,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <FloatingPanel
      position="left"
      width="39%"
      top={80}
      scrollable
      closable
      onClose={onClose}
      header={
        station ? (
          <Styled.HeaderContent>
            <Styled.StationName variant="h1">{station.name}</Styled.StationName>
            <Styled.Coordinates>
              {station.location.coordinates[1].toFixed(4)}°N,{' '}
              {station.location.coordinates[0].toFixed(4)}°E
            </Styled.Coordinates>
          </Styled.HeaderContent>
        ) : null
      }
    >
      {/* Subtle loading indicator at the top */}
      {isFetching && (
        <LinearProgress
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        />
      )}

      <Styled.ContentWrapper>
        {/* Error State */}
        {error && !station && (
          <Styled.ErrorContainer>
            <Typography color="error" align="center">
              Failed to load station details
            </Typography>
          </Styled.ErrorContainer>
        )}

        {/* Show loading message only on first load */}
        {isLoading && !station && (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}
          >
            <Typography color="text.secondary">Loading station details...</Typography>
          </Box>
        )}

        {/* Station Content - shows even while fetching new data */}
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
              Last updated: {new Date(station.updatedAt).toLocaleDateString('fi-FI')}
            </Typography>
          </>
        )}
      </Styled.ContentWrapper>
    </FloatingPanel>
  );
};
