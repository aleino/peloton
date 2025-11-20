import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { StationsLayer } from './StationsLayer';
import { stationsReducer } from '../../stations.store';
import type { StationFeatureCollection } from '@peloton/shared';

// Mock dependencies
vi.mock('react-map-gl/mapbox', () => ({
  Source: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-source">{children}</div>
  ),
  Layer: (props: { id: string }) => <div data-testid="mock-layer" data-layer-id={props.id} />,
  useMap: vi.fn(() => ({
    main: {
      getLayer: vi.fn(() => null),
      getMap: vi.fn(() => ({
        setLayoutProperty: vi.fn(),
      })),
      getCanvas: vi.fn(() => ({
        style: { cursor: '' },
      })),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
    },
  })),
}));

vi.mock('../../api', () => ({
  useStationsQuery: vi.fn(),
}));

vi.mock('../../hooks/useStationIcons', () => ({
  useStationIcons: vi.fn(),
}));

const mockStationsData: StationFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [24.9384, 60.1699],
      },
      properties: {
        stationId: '001',
        name: 'Kaivopuisto',
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [24.9404, 60.1709],
      },
      properties: {
        stationId: '002',
        name: 'Rautatientori',
      },
    },
  ],
};

// Helper to render with Redux store
function renderWithStore(component: React.ReactElement) {
  const store = configureStore({
    reducer: {
      stations: stationsReducer,
    },
  });

  return render(<Provider store={store}>{component}</Provider>);
}

describe('StationsLayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing while loading', async () => {
    const { useStationsQuery } = await import('../../api');
    vi.mocked(useStationsQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
      isSuccess: false,
      refetch: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const { container } = renderWithStore(<StationsLayer />);
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing on error', async () => {
    const { useStationsQuery } = await import('../../api');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(useStationsQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      isError: true,
      isSuccess: false,
      refetch: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const { container } = renderWithStore(<StationsLayer />);

    expect(container.firstChild).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load stations:', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it('should render Source and Layer with valid data', async () => {
    const { useStationsQuery } = await import('../../api');
    vi.mocked(useStationsQuery).mockReturnValue({
      data: mockStationsData,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    renderWithStore(<StationsLayer />);

    expect(screen.getByTestId('mock-source')).toBeInTheDocument();
    expect(screen.getByTestId('mock-layer')).toBeInTheDocument();
    expect(screen.getByTestId('mock-layer')).toHaveAttribute('data-layer-id', 'stations-layer');
  });

  it('should render nothing if data is not a FeatureCollection', async () => {
    const { useStationsQuery } = await import('../../api');
    vi.mocked(useStationsQuery).mockReturnValue({
      data: { invalid: 'data' },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const { container } = renderWithStore(<StationsLayer />);
    expect(container.firstChild).toBeNull();
  });

  it('should call useStationIcons hook', async () => {
    const { useStationsQuery } = await import('../../api');
    const { useStationIcons } = await import('../../hooks/useStationIcons');

    vi.mocked(useStationsQuery).mockReturnValue({
      data: mockStationsData,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    renderWithStore(<StationsLayer />);

    expect(useStationIcons).toHaveBeenCalled();
  });
});
