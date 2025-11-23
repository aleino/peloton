import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { StationSymbolsLayer } from '../StationSymbols.layer';

// Mock dependencies
vi.mock('react-map-gl/mapbox', () => ({
  Layer: ({ id }: { id: string }) => <div data-testid={`layer-${id}`} />,
}));

vi.mock('../../hooks', () => ({
  useStationIcons: vi.fn(),
  useIconExpression: vi.fn(),
}));

vi.mock('@/features/stations', () => ({
  useStations: vi.fn(),
}));

import * as hooks from '../../hooks';
import * as stations from '@/features/stations';

describe('StationSymbolsLayer', () => {
  beforeEach(() => {
    vi.mocked(stations.useStations).mockReturnValue({
      selectedDepartureStationId: null,
      selectedReturnStationId: null,
      hoveredStation: null,
      setHoveredStation: vi.fn(),
      setSelectedDepartureStationId: vi.fn(),
      setSelectedReturnStationId: vi.fn(),
      clearStationSelections: vi.fn(),
      showAllTooltips: false,
      visibleStationsForTooltips: [],
      setShowAllTooltips: vi.fn(),
      setVisibleStationsForTooltips: vi.fn(),
    });
  });

  it('should render symbol layer', () => {
    const { getByTestId } = render(<StationSymbolsLayer />);
    // Note: Layer ID is 'stations-layer' (from STATIONS_SYMBOLS_LAYER_ID constant)
    expect(getByTestId('layer-stations-layer')).toBeDefined();
  });

  it('should call useStationIcons hook', () => {
    render(<StationSymbolsLayer />);
    expect(hooks.useStationIcons).toHaveBeenCalled();
  });

  it('should call useIconExpression hook with correct parameters', () => {
    render(<StationSymbolsLayer />);
    expect(hooks.useIconExpression).toHaveBeenCalledWith({
      layerId: 'stations-layer',
      selectedStationId: null,
      hoveredStationId: null,
    });
  });

  it('should pass correct IDs to useIconExpression', () => {
    vi.mocked(stations.useStations).mockReturnValue({
      selectedDepartureStationId: 'station-1',
      selectedReturnStationId: null,
      hoveredStation: {
        stationId: 'station-2',
        coordinates: [0, 0],
        properties: { stationId: 'station-2', name: 'Test Station' },
      },
      setHoveredStation: vi.fn(),
      setSelectedDepartureStationId: vi.fn(),
      setSelectedReturnStationId: vi.fn(),
      clearStationSelections: vi.fn(),
      showAllTooltips: false,
      visibleStationsForTooltips: [],
      setShowAllTooltips: vi.fn(),
      setVisibleStationsForTooltips: vi.fn(),
    });

    render(<StationSymbolsLayer />);

    expect(hooks.useIconExpression).toHaveBeenCalledWith({
      layerId: 'stations-layer',
      selectedStationId: 'station-1',
      hoveredStationId: 'station-2',
    });
  });
});
