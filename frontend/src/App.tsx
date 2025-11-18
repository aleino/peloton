import { RouterProvider } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { router } from '@/app/router';

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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
