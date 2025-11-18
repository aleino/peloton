import { configureStore } from '@reduxjs/toolkit';
import { filterReducer } from '@/features/filters/filters.store';
import { settingsReducer } from '@/features/settings/settings.store';

export const store = configureStore({
  reducer: {
    filters: filterReducer,
    settings: settingsReducer,
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
