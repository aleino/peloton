import { createTheme, ThemeOptions } from '@mui/material/styles';

// Neutral color palette - subtle and complementary to maps
const NEUTRAL_SLATE = '#64748b'; // Primary neutral
const NEUTRAL_GRAY = '#94a3b8'; // Secondary neutral
const ACCENT_TEAL = '#14b8a6'; // Subtle accent for interactions

// Extend MUI theme types for custom properties
declare module '@mui/material/styles' {
  interface Palette {
    glassmorphism: {
      backgroundColor: string;
      backdropFilter: string;
      WebkitBackdropFilter: string;
      border: string;
      boxShadow: string;
    };
    alpha: {
      8: string;
      12: string;
      16: string;
      24: string;
      38: string;
      60: string;
    };
  }
  interface PaletteOptions {
    glassmorphism?: {
      backgroundColor: string;
      backdropFilter: string;
      WebkitBackdropFilter: string;
      border: string;
      boxShadow: string;
    };
    alpha?: {
      8: string;
      12: string;
      16: string;
      24: string;
      38: string;
      60: string;
    };
  }
  interface TypeBackground {
    glassmorphism?: {
      backgroundColor: string;
      backdropFilter: string;
      WebkitBackdropFilter: string;
      border: string;
      boxShadow: string;
    };
  }
  interface Duration {
    filterMenu?: number;
    filterButton?: number;
  }
}

// Glassmorphism styles for floating components
// Subtle glass effect, similar to hover popup
const glassmorphism = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)', // Pure white with high opacity
    backdropFilter: 'blur(12px) saturate(120%)',
    WebkitBackdropFilter: 'blur(12px) saturate(120%)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    boxShadow:
      '0px 5px 5px -3px rgba(0, 0, 0, 0.2), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0, 0, 0, 0.12)',
  },
  dark: {
    backgroundColor: 'rgba(25, 30, 40, 0.95)', // Blend between neutral gray and dark slate
    backdropFilter: 'blur(32px) saturate(20%)',
    WebkitBackdropFilter: 'blur(32px) saturate(20%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow:
      '0px 5px 5px -3px rgba(0, 0, 0, 0.4), 0px 8px 10px 1px rgba(0, 0, 0, 0.28), 0px 3px 14px 2px rgba(0, 0, 0, 0.24)',
  },
};

// Common theme options (shared between light/dark)
const commonThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 8,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
      // Custom durations for MapControls
      filterMenu: 200,
      filterButton: 200,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 6,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
  },
};

// Light theme - designed to complement Mapbox light style
export const lightTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: 'light',
    primary: {
      main: NEUTRAL_SLATE, // Neutral slate
      light: '#94a3b8',
      dark: '#475569',
      contrastText: '#ffffff',
    },
    secondary: {
      main: ACCENT_TEAL, // Subtle teal accent
      light: '#5eead4',
      dark: '#0f766e',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc', // Very light gray, works with map
      paper: 'rgba(255, 255, 255, 0.95)', // Semi-transparent for overlays
    },
    glassmorphism: glassmorphism.light,
    alpha: {
      8: 'rgba(0, 0, 0, 0.08)', // Subtle borders
      12: 'rgba(0, 0, 0, 0.12)', // Hover states
      16: 'rgba(0, 0, 0, 0.16)', // Dividers
      24: 'rgba(0, 0, 0, 0.24)', // Active borders
      38: 'rgba(0, 0, 0, 0.38)', // Disabled text
      60: 'rgba(0, 0, 0, 0.6)', // Secondary text
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      disabled: '#cbd5e1',
    },
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f59e0b',
    },
    info: {
      main: '#3b82f6',
    },
    success: {
      main: '#10b981',
    },
    divider: 'rgba(0, 0, 0, 0.06)', // Very subtle dividers
  },
  components: {
    MuiButton: {
      styleOverrides: {
        outlined: {
          borderColor: 'rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(0, 0, 0, 0.06)',
        },
        elevation0: {
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: 'none',
        },
        elevation2: {
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});

// Dark theme - designed to complement Mapbox dark style
export const darkTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: NEUTRAL_GRAY, // Lighter neutral for dark mode
      light: '#cbd5e1',
      dark: NEUTRAL_SLATE,
      contrastText: '#0f172a',
    },
    secondary: {
      main: ACCENT_TEAL, // Same subtle accent
      light: '#5eead4',
      dark: '#0f766e',
      contrastText: '#0f172a',
    },
    background: {
      default: '#0f172a', // Dark slate, matches Mapbox dark
      paper: 'rgba(30, 41, 59, 0.95)', // Semi-transparent for overlays
    },
    glassmorphism: glassmorphism.dark,
    alpha: {
      8: 'rgba(255, 255, 255, 0.08)', // Subtle borders
      12: 'rgba(255, 255, 255, 0.12)', // Hover states
      16: 'rgba(255, 255, 255, 0.16)', // Dividers
      24: 'rgba(255, 255, 255, 0.24)', // Active borders
      38: 'rgba(255, 255, 255, 0.38)', // Disabled text
      60: 'rgba(255, 255, 255, 0.6)', // Secondary text
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
      disabled: '#475569',
    },
    error: {
      main: '#f87171',
    },
    warning: {
      main: '#fbbf24',
    },
    info: {
      main: '#60a5fa',
    },
    success: {
      main: '#34d399',
    },
    divider: 'rgba(255, 255, 255, 0.06)', // Very subtle dividers
  },
  components: {
    MuiButton: {
      styleOverrides: {
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.12)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        },
        elevation0: {
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: 'none',
        },
        elevation2: {
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(255, 255, 255, 0.06)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        },
      },
    },
  },
});
