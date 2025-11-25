import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { StationClustersLayer } from '../StationClusters.layer';

// Mock dependencies
vi.mock('react-map-gl/mapbox', () => ({
  Layer: ({ id }: { id: string }) => <div data-testid={`layer-${id}`} />,
}));

vi.mock('../../hooks', () => ({
  useColorScaleExpression: vi.fn().mockReturnValue('mock-color-expression'),
  useClusterEventHandlers: vi.fn(),
}));

vi.mock('@/features/map/hooks', () => ({
  useMapSource: vi.fn(),
  useMapControls: vi.fn(),
}));

import * as mapHooks from '@/features/map/hooks';

import * as hooks from '../../hooks';

describe('StationClustersLayer', () => {
  const mockData = {
    type: 'FeatureCollection' as const,
    features: [],
  };

  beforeEach(() => {
    vi.mocked(mapHooks.useMapSource).mockReturnValue(mockData);
    vi.mocked(mapHooks.useMapControls).mockReturnValue({
      metric: 'tripCount' as const,
      direction: 'departures' as const,
      style: 'dark' as const,
      visualization: 'points' as const,
      controls: {
        style: 'dark' as const,
        visualization: 'points' as const,
        direction: 'departures' as const,
        metric: 'tripCount' as const,
      },
      updateStyle: vi.fn(),
      updateVisualization: vi.fn(),
      updateDirection: vi.fn(),
      updateMetric: vi.fn(),
      updateControls: vi.fn(),
    });
  });

  it('should render cluster and count layers', () => {
    const { getByTestId } = render(<StationClustersLayer />);
    expect(getByTestId('layer-stations-clusters')).toBeDefined();
    expect(getByTestId('layer-stations-cluster-count')).toBeDefined();
  });

  it('should render two layers', () => {
    const { container } = render(<StationClustersLayer />);
    const layers = container.querySelectorAll('[data-testid^="layer-"]');
    expect(layers).toHaveLength(2);
  });

  it('should call useColorScaleExpression hook', () => {
    render(<StationClustersLayer />);
    expect(hooks.useColorScaleExpression).toHaveBeenCalledWith(
      expect.objectContaining({
        inputValue: expect.arrayContaining([
          '/',
          ['get', 'sumDeparturesCount'],
          ['get', 'point_count'],
        ]),
      })
    );
  });

  it('should call useClusterEventHandlers hook with layer ID', () => {
    render(<StationClustersLayer />);
    expect(hooks.useClusterEventHandlers).toHaveBeenCalledWith('stations-clusters');
  });
});
