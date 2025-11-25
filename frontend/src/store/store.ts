import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { filterReducer } from '@/features/filters/filters.store';
import { settingsReducer } from '@/features/settings/settings.store';
import { stationsReducer } from '@/features/stations/stations.store';
import { mapControlsReducer } from '@/features/map/mapControls.store';

export const store = configureStore({
  reducer: {
    filters: filterReducer,
    settings: settingsReducer,
    stations: stationsReducer,
    map: combineReducers({
      controls: mapControlsReducer,
    }),
  },
  // Enable Redux DevTools in development
  devTools: import.meta.env.MODE !== 'production',

  // Middleware configuration (default async middleware + custom)
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Disable serialization check for Date objects in filters
      serializableCheck: {
        ignoredActions: ['filters/setDateRange'],
        ignoredPaths: ['filters.dateRange'],
      },
    }),
});

// Infer types from the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
