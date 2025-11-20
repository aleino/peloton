import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { StationMapEventData } from './types';

/**
 * State for station selection and hover
 */
export interface StationsState {
  hoveredStation: StationMapEventData | null;
  selectedDepartureStationId: string | null;
  selectedReturnStationId: string | null;
}

const initialState: StationsState = {
  hoveredStation: null,
  selectedDepartureStationId: null,
  selectedReturnStationId: null,
};

const stationsSlice = createSlice({
  name: 'stations',
  initialState,
  reducers: {
    setHoveredStation: (state, action: PayloadAction<StationMapEventData | null>) => {
      state.hoveredStation = action.payload;
    },
    setSelectedDepartureStationId: (state, action: PayloadAction<string | null>) => {
      state.selectedDepartureStationId = action.payload;
    },
    setSelectedReturnStationId: (state, action: PayloadAction<string | null>) => {
      state.selectedReturnStationId = action.payload;
    },
    clearStationSelections: (state) => {
      state.selectedDepartureStationId = null;
      state.selectedReturnStationId = null;
    },
  },
});

export const {
  setHoveredStation,
  setSelectedDepartureStationId,
  setSelectedReturnStationId,
  clearStationSelections,
} = stationsSlice.actions;

export const stationsReducer = stationsSlice.reducer;
