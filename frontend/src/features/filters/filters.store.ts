import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FilterState {
  dateRange: {
    start: string | null; // ISO date string
    end: string | null;
  };
  selectedStations: string[]; // Station IDs
  timeOfDay: 'all' | 'morning' | 'afternoon' | 'evening' | 'night';
  distanceRange: {
    min: number; // meters
    max: number;
  };
  durationRange: {
    min: number; // seconds
    max: number;
  };
}

const initialState: FilterState = {
  dateRange: {
    start: null,
    end: null,
  },
  selectedStations: [],
  timeOfDay: 'all',
  distanceRange: {
    min: 0,
    max: 10000, // 10km default max
  },
  durationRange: {
    min: 0,
    max: 3600, // 1 hour default max
  },
};

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setDateRange: (state, action: PayloadAction<{ start: string | null; end: string | null }>) => {
      state.dateRange = action.payload;
    },
    setSelectedStations: (state, action: PayloadAction<string[]>) => {
      state.selectedStations = action.payload;
    },
    setTimeOfDay: (state, action: PayloadAction<FilterState['timeOfDay']>) => {
      state.timeOfDay = action.payload;
    },
    setDistanceRange: (state, action: PayloadAction<{ min: number; max: number }>) => {
      state.distanceRange = action.payload;
    },
    setDurationRange: (state, action: PayloadAction<{ min: number; max: number }>) => {
      state.durationRange = action.payload;
    },
    resetFilters: () => initialState,
  },
});

export const {
  setDateRange,
  setSelectedStations,
  setTimeOfDay,
  setDistanceRange,
  setDurationRange,
  resetFilters,
} = filterSlice.actions;

export const filterReducer = filterSlice.reducer;

// Selectors
export const selectFilters = (state: { filters: FilterState }) => state.filters;
