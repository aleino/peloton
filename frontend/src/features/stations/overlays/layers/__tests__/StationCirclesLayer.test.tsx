import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { StationCirclesLayer } from '../StationCircles.layer';

// Mock dependencies
vi.mock('react-map-gl/mapbox', () => ({
  Layer: ({ id }: { id: string }) => <div data-testid={`layer-${id}`} />,
}));

vi.mock('../../hooks', () => ({
  useColorScaleExpression: vi.fn().mockReturnValue('mock-color-expression'),
  useStationEventHandlers: vi.fn(),
}));

vi.mock('@/features/map/hooks', () => ({
  useMapSource: vi.fn(),
  useMapControls: vi.fn(),
}));

import * as hooks from '../../hooks';
import * as mapHooks from '@/features/map/hooks';

describe('StationCirclesLayer', () => {
  beforeEach(() => {
    vi.mocked(mapHooks.useMapSource).mockReturnValue(null);
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

  it('should render circle layer', () => {
    const { getByTestId } = render(<StationCirclesLayer />);
    expect(getByTestId('layer-stations-circles')).toBeDefined();
  });

  it('should call useColorScaleExpression hook with correct parameters', () => {
    render(<StationCirclesLayer />);
    expect(hooks.useColorScaleExpression).toHaveBeenCalledWith({
      geojsonData: null,
      inputValue: ['get', 'departuresCount'],
    });
  });

  it('should call useStationEventHandlers hook with layer ID and source ID', () => {
    render(<StationCirclesLayer />);
    expect(hooks.useStationEventHandlers).toHaveBeenCalledWith(
      'stations-circles',
      'stations-source'
    );
  });

  it('should pass geojsonData when available', () => {
    const mockData = {
      type: 'FeatureCollection' as const,
      features: [],
    };

    vi.mocked(mapHooks.useMapSource).mockReturnValue(mockData);

    render(<StationCirclesLayer />);

    expect(hooks.useColorScaleExpression).toHaveBeenCalledWith(
      expect.objectContaining({
        geojsonData: mockData,
      })
    );
  });
});
