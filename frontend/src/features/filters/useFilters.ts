import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectFilters,
  setDateRange,
  setSelectedStations,
  setTimeOfDay,
  setDistanceRange,
  setDurationRange,
  resetFilters,
} from './filters.store';

export const useFilters = () => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);

  return {
    filters,
    setDateRange: (dateRange: { start: string | null; end: string | null }) =>
      dispatch(setDateRange(dateRange)),
    setSelectedStations: (stationIds: string[]) => dispatch(setSelectedStations(stationIds)),
    setTimeOfDay: (timeOfDay: 'all' | 'morning' | 'afternoon' | 'evening' | 'night') =>
      dispatch(setTimeOfDay(timeOfDay)),
    setDistanceRange: (range: { min: number; max: number }) => dispatch(setDistanceRange(range)),
    setDurationRange: (range: { min: number; max: number }) => dispatch(setDurationRange(range)),
    resetFilters: () => dispatch(resetFilters()),
  };
};
