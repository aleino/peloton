import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MapControls } from './MapControls';

vi.mock('react-map-gl/mapbox', () => ({
  NavigationControl: () => <div data-testid="navigation-control" />,
  GeolocateControl: () => <div data-testid="geolocate-control" />,
}));

vi.mock('../MapResetButton/MapResetButton', () => ({
  MapResetButton: () => <div data-testid="map-reset-button" />,
}));

describe('MapControls', () => {
  it('should render navigation control by default', () => {
    const { getByTestId } = render(<MapControls />);
    expect(getByTestId('navigation-control')).toBeInTheDocument();
  });

  it('should render geolocate control by default', () => {
    const { getByTestId } = render(<MapControls />);
    expect(getByTestId('geolocate-control')).toBeInTheDocument();
  });

  it('should hide controls when disabled', () => {
    const { queryByTestId } = render(<MapControls showNavigation={false} showGeolocate={false} />);

    expect(queryByTestId('navigation-control')).not.toBeInTheDocument();
    expect(queryByTestId('geolocate-control')).not.toBeInTheDocument();
  });

  it('should show only navigation control when geolocate is disabled', () => {
    const { getByTestId, queryByTestId } = render(<MapControls showGeolocate={false} />);

    expect(getByTestId('navigation-control')).toBeInTheDocument();
    expect(queryByTestId('geolocate-control')).not.toBeInTheDocument();
  });

  it('should show only geolocate control when navigation is disabled', () => {
    const { getByTestId, queryByTestId } = render(<MapControls showNavigation={false} />);

    expect(queryByTestId('navigation-control')).not.toBeInTheDocument();
    expect(getByTestId('geolocate-control')).toBeInTheDocument();
  });
});
