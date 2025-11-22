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
}));

import * as hooks from '../../hooks';
import * as mapHooks from '@/features/map/hooks';

describe('StationCirclesLayer', () => {
  beforeEach(() => {
    vi.mocked(mapHooks.useMapSource).mockReturnValue(null);
  });

  it('should render circle layer', () => {
    const { getByTestId } = render(<StationCirclesLayer />);
    expect(getByTestId('layer-stations-circles')).toBeDefined();
  });

  it('should call useColorScaleExpression hook with correct parameters', () => {
    render(<StationCirclesLayer />);
    expect(hooks.useColorScaleExpression).toHaveBeenCalledWith({
      geojsonData: null,
      inputValue: ['get', 'totalDepartures'],
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
