import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setHoveredStation,
  setSelectedDepartureStationId,
  setSelectedReturnStationId,
  clearStationSelections,
} from './stations.store';
import type { StationMapEventData } from './types';

/**
 * Hook for accessing and managing station state
 */
export const useStations = () => {
  const dispatch = useAppDispatch();

  const hoveredStation = useAppSelector((state) => state.stations.hoveredStation);
  const selectedDepartureStationId = useAppSelector(
    (state) => state.stations.selectedDepartureStationId
  );
  const selectedReturnStationId = useAppSelector((state) => state.stations.selectedReturnStationId);

  const handleSetHoveredStation = (station: StationMapEventData | null) => {
    dispatch(setHoveredStation(station));
  };

  const handleSetSelectedDepartureStationId = (stationId: string | null) => {
    dispatch(setSelectedDepartureStationId(stationId));
  };

  const handleSetSelectedReturnStationId = (stationId: string | null) => {
    dispatch(setSelectedReturnStationId(stationId));
  };

  const handleClearStationSelections = () => {
    dispatch(clearStationSelections());
  };

  return {
    hoveredStation,
    selectedDepartureStationId,
    selectedReturnStationId,
    setHoveredStation: handleSetHoveredStation,
    setSelectedDepartureStationId: handleSetSelectedDepartureStationId,
    setSelectedReturnStationId: handleSetSelectedReturnStationId,
    clearStationSelections: handleClearStationSelections,
  };
};
