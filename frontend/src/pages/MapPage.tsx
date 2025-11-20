import { FloatingHeader } from '@/components/layout';
import { MapStyleSwitcher } from '@/features/map';
import { StationDetailPanel, useStations } from '@/features/stations';
import { Box } from '@mui/material';

/**
 * Main map page with floating UI elements
 *
 * Layout:
 * - FloatingHeader at top
 * - StationDetailPanel on left (39% width, opens on station click)
 * - Map remains interactive in all other areas
 */
export const MapPage = () => {
  const { selectedDepartureStationId, setSelectedDepartureStationId } = useStations();

  return (
    <>
      {/* Floating header */}
      <FloatingHeader
        title="Peloton"
        rightContent={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MapStyleSwitcher position={{ top: 0, right: 0 }} />
          </Box>
        }
      />

      {/* Station detail panel */}
      <StationDetailPanel
        stationId={selectedDepartureStationId}
        isOpen={selectedDepartureStationId !== null}
        onClose={() => setSelectedDepartureStationId(null)}
      />
    </>
  );
};
