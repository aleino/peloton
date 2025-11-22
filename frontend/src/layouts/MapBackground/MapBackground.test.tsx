import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MapBackground } from './MapBackground';
import { stationsReducer } from '@/features/stations/stations.store';
import type { ReactNode } from 'react';

// Mock the entire map feature module
vi.mock('@/features/map', () => ({
  BaseMap: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="base-map">
      Map
      {children}
    </div>
  ),
  MapControls: () => <div data-testid="map-controls" />,
  MapResetButton: () => <div data-testid="map-reset-button" />,
}));

// Mock the stations layer
vi.mock('@/features/stations/components/StationsLayer', () => ({
  StationsLayer: () => <div data-testid="stations-layer" />,
}));

// Mock the station hover popup
vi.mock('@/features/stations/components/StationHoverPopup', () => ({
  StationHoverPopup: () => <div data-testid="station-hover-popup" />,
}));

describe('MapBackground', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  function wrapper({ children }: { children: ReactNode }) {
    const store = configureStore({
      reducer: {
        stations: stationsReducer,
      },
    });

    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </Provider>
    );
  }

  it('should render BaseMap inside MapProvider', () => {
    render(<MapBackground />, { wrapper });
    expect(screen.getByTestId('base-map')).toBeInTheDocument();
  });

  it('should have fixed positioning styles', () => {
    const { container } = render(<MapBackground />, { wrapper });
    const wrapper_element = container.firstChild as HTMLElement;

    expect(wrapper_element).toHaveStyle({
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
    });
  });

  it('should have z-index 0', () => {
    const { container } = render(<MapBackground />, { wrapper });
    const wrapper_element = container.firstChild as HTMLElement;

    expect(wrapper_element).toHaveStyle({
      zIndex: 0,
    });
  });
});
