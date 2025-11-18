import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider } from 'react-redux';
import { router } from '@/app/router';
import { queryClient } from '@/services/queryClient';
import { store } from '@/store/store';
import { AppThemeProvider } from '@/app/ThemeProvider';

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <RouterProvider router={router} />
        </AppThemeProvider>

        {/* React Query DevTools - only visible in development */}
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
