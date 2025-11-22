import { FloatingHeader } from '@/layouts';
import { MapStyleSwitcher } from '@/features/map';
import { StationDetailPanel, useStations } from '@/features/stations';

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
      <FloatingHeader title="Peloton" rightContent={<MapStyleSwitcher />} />

      {/* Station detail panel */}
      <StationDetailPanel
        stationId={selectedDepartureStationId}
        isOpen={selectedDepartureStationId !== null}
        onClose={() => setSelectedDepartureStationId(null)}
      />
    </>
  );
};
