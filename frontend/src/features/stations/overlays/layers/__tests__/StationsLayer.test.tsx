import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import { StationsLayer } from '../Stations.layer';

// Mock dependencies
vi.mock('react-map-gl/mapbox', () => ({
  Source: ({ children, id }: { children: React.ReactNode; id: string }) => (
    <div data-testid={`source-${id}`}>{children}</div>
  ),
}));

vi.mock('@/features/stations/api', () => ({
  useStationsQuery: vi.fn(),
}));

vi.mock('@/features/map/hooks', () => ({
  useMapControls: vi.fn().mockReturnValue({
    visualization: 'points',
    metric: 'tripCount',
    direction: 'departures',
  }),
  useWaterLayerOrder: vi.fn().mockReturnValue({
    restoreOriginalOrder: vi.fn(),
  }),
}));

vi.mock('../StationCircles.layer', () => ({
  StationCirclesLayer: () => <div data-testid="circles-layer" />,
}));

vi.mock('../StationSymbols.layer', () => ({
  StationSymbolsLayer: () => <div data-testid="symbols-layer" />,
}));

vi.mock('../StationClusters.layer', () => ({
  StationClustersLayer: () => <div data-testid="clusters-layer" />,
}));

vi.mock('../StationVoronoi.layer', () => ({
  StationVoronoiLayer: () => <div data-testid="voronoi-layer" />,
}));

import * as api from '@/features/stations/api';

describe('StationsLayer', () => {
  const mockData = {
    type: 'FeatureCollection' as const,
    features: [],
  };

  it('should render source and sub-layers when data is available', () => {
    console.log('Running test: render source and sub-layers');
    vi.mocked(api.useStationsQuery).mockReturnValue({
      data: mockData as unknown as api.FlattenedStationFeatureCollection,
      isLoading: false,
      error: null,
    } as unknown as UseQueryResult<api.FlattenedStationFeatureCollection, Error>);

    render(<StationsLayer />);

    expect(screen.getByTestId('source-stations-source')).toBeDefined();
    expect(screen.getByTestId('clusters-layer')).toBeDefined();
    expect(screen.getByTestId('circles-layer')).toBeDefined();
    expect(screen.getByTestId('symbols-layer')).toBeDefined();
  });

  it('should not render when loading', () => {
    vi.mocked(api.useStationsQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as UseQueryResult<api.FlattenedStationFeatureCollection, Error>);

    const { container } = render(<StationsLayer />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when error', () => {
    vi.mocked(api.useStationsQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    } as unknown as UseQueryResult<api.FlattenedStationFeatureCollection, Error>);

    const { container } = render(<StationsLayer />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when no data', () => {
    vi.mocked(api.useStationsQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as unknown as UseQueryResult<api.FlattenedStationFeatureCollection, Error>);

    const { container } = render(<StationsLayer />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when data is not a FeatureCollection', () => {
    vi.mocked(api.useStationsQuery).mockReturnValue({
      data: { type: 'Feature' } as unknown as api.FlattenedStationFeatureCollection, // Not a FeatureCollection
      isLoading: false,
      error: null,
    } as unknown as UseQueryResult<api.FlattenedStationFeatureCollection, Error>);

    const { container } = render(<StationsLayer />);
    expect(container.firstChild).toBeNull();
  });

  it('should render layers in correct order', () => {
    vi.mocked(api.useStationsQuery).mockReturnValue({
      data: mockData as unknown as api.FlattenedStationFeatureCollection,
      isLoading: false,
      error: null,
    } as unknown as UseQueryResult<api.FlattenedStationFeatureCollection, Error>);

    const { container } = render(<StationsLayer />);
    const layers = Array.from(container.querySelectorAll('[data-testid$="-layer"]')).map((el) =>
      el.getAttribute('data-testid')
    );

    expect(layers).toEqual(['clusters-layer', 'circles-layer', 'symbols-layer']);
  });
});
