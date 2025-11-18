import { describe, it, expect } from 'vitest';
import {
  filterReducer,
  setDateRange,
  setSelectedStations,
  setTimeOfDay,
  setDistanceRange,
  setDurationRange,
  resetFilters,
  selectFilters,
  type FilterState,
} from './filters.store';

describe('filterSlice', () => {
  describe('reducers', () => {
    it('should return initial state', () => {
      const state = filterReducer(undefined, { type: '@@INIT' });
      expect(state).toEqual({
        dateRange: {
          start: null,
          end: null,
        },
        selectedStations: [],
        timeOfDay: 'all',
        distanceRange: {
          min: 0,
          max: 10000,
        },
        durationRange: {
          min: 0,
          max: 3600,
        },
      });
    });

    it('should set date range', () => {
      const state = filterReducer(
        undefined,
        setDateRange({ start: '2024-01-01', end: '2024-01-31' })
      );
      expect(state.dateRange.start).toBe('2024-01-01');
      expect(state.dateRange.end).toBe('2024-01-31');
    });

    it('should set selected stations', () => {
      const stationIds = ['station-1', 'station-2', 'station-3'];
      const state = filterReducer(undefined, setSelectedStations(stationIds));
      expect(state.selectedStations).toEqual(stationIds);
    });

    it('should set time of day', () => {
      const state = filterReducer(undefined, setTimeOfDay('morning'));
      expect(state.timeOfDay).toBe('morning');
    });

    it('should set distance range', () => {
      const state = filterReducer(undefined, setDistanceRange({ min: 500, max: 5000 }));
      expect(state.distanceRange).toEqual({ min: 500, max: 5000 });
    });

    it('should set duration range', () => {
      const state = filterReducer(undefined, setDurationRange({ min: 300, max: 1800 }));
      expect(state.durationRange).toEqual({ min: 300, max: 1800 });
    });

    it('should reset filters to initial state', () => {
      // First modify the state
      let state = filterReducer(
        undefined,
        setDateRange({ start: '2024-01-01', end: '2024-01-31' })
      );
      state = filterReducer(state, setSelectedStations(['station-1']));
      state = filterReducer(state, setTimeOfDay('evening'));

      // Then reset
      const resetState = filterReducer(state, resetFilters());

      expect(resetState.dateRange.start).toBeNull();
      expect(resetState.dateRange.end).toBeNull();
      expect(resetState.selectedStations).toEqual([]);
      expect(resetState.timeOfDay).toBe('all');
    });
  });

  describe('selectors', () => {
    const mockState = {
      filters: {
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
        selectedStations: ['station-1', 'station-2'],
        timeOfDay: 'morning' as const,
        distanceRange: { min: 100, max: 5000 },
        durationRange: { min: 300, max: 1800 },
      } as FilterState,
    };

    it('should select all filters', () => {
      const filters = selectFilters(mockState);
      expect(filters.dateRange).toEqual({ start: '2024-01-01', end: '2024-01-31' });
      expect(filters.selectedStations).toEqual(['station-1', 'station-2']);
      expect(filters.timeOfDay).toBe('morning');
      expect(filters.distanceRange).toEqual({ min: 100, max: 5000 });
      expect(filters.durationRange).toEqual({ min: 300, max: 1800 });
    });
  });
});
