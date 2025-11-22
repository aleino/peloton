import { useCallback } from 'react';
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

  const handleSetHoveredStation = useCallback(
    (station: StationMapEventData | null) => {
      dispatch(setHoveredStation(station));
    },
    [dispatch]
  );

  const handleSetSelectedDepartureStationId = useCallback(
    (stationId: string | null) => {
      dispatch(setSelectedDepartureStationId(stationId));
    },
    [dispatch]
  );

  const handleSetSelectedReturnStationId = useCallback(
    (stationId: string | null) => {
      dispatch(setSelectedReturnStationId(stationId));
    },
    [dispatch]
  );

  const handleClearStationSelections = useCallback(() => {
    dispatch(clearStationSelections());
  }, [dispatch]);

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
