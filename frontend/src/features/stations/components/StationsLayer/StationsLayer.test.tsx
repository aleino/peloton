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
      getSource: vi.fn(() => null),
      getMap: vi.fn(() => ({
        setLayoutProperty: vi.fn(),
      })),
      getCanvas: vi.fn(() => ({
        style: { cursor: '' },
      })),
      setFeatureState: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
    },
  })),
}));

vi.mock('../../api', () => ({
  useStationsQuery: vi.fn(),
}));

vi.mock('../../overlay/hooks/useStationIcons', () => ({
  useStationIcons: vi.fn(),
}));

const mockStationsData: StationFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: '001',
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
      id: '002',
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

    const layers = screen.getAllByTestId('mock-layer');
    expect(layers).toHaveLength(4);

    const layerIds = layers.map((layer) => layer.getAttribute('data-layer-id'));
    expect(layerIds).toContain('stations-clusters');
    expect(layerIds).toContain('stations-cluster-count');
    expect(layerIds).toContain('stations-circles');
    expect(layerIds).toContain('stations-layer');
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
    const { useStationIcons } = await import('../../overlays/hooks/useStationIcons');

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
