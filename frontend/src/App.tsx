import { RouterProvider } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider } from 'react-redux';
import { router } from '@/app/router';
import { queryClient } from '@/services/queryClient';
import { store } from '@/store/store';

// Basic theme - will be enhanced in later tasks
const theme = createTheme({
  palette: {
    primary: {
      main: '#007AC9', // HSL blue
    },
    secondary: {
      main: '#FF6319', // HSL orange
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <RouterProvider router={router} />
        </ThemeProvider>

        {/* React Query DevTools - only visible in development */}
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
