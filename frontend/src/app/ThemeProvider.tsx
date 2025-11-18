import { ReactNode, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { selectTheme } from '@/features/settings/settings.store';
import { lightTheme, darkTheme } from './theme';

interface AppThemeProviderProps {
  children: ReactNode;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const themeSetting = useAppSelector(selectTheme);

  // Determine theme based on setting
  const theme = useMemo(() => {
    if (themeSetting === 'dark') {
      return darkTheme;
    }
    if (themeSetting === 'light') {
      return lightTheme;
    }
    // 'system' mode: detect system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return darkTheme;
    }
    return lightTheme;
  }, [themeSetting]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline /> {/* Normalize CSS and apply background color */}
      {children}
    </MuiThemeProvider>
  );
}
