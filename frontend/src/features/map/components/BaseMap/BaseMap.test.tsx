import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BaseMap } from './BaseMap';
import { MapProvider } from '../../context/MapContext';
import React from 'react';

// Mock react-map-gl to avoid Mapbox GL JS in tests
vi.mock('react-map-gl/mapbox', async () => {
  const React = await import('react');
  return {
    Map: React.forwardRef(({ children, onLoad }: any, _ref: any) => {
      // Simulate map load after a short delay
      React.useEffect(() => {
        setTimeout(() => onLoad?.(), 10);
      }, [onLoad]);
      return <div data-testid="mock-map">{children}</div>;
    }),
    NavigationControl: () => <div data-testid="navigation-control" />,
    GeolocateControl: () => <div data-testid="geolocate-control" />,
  };
});

// Mock mapbox-gl CSS import
vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}));

const renderBaseMap = (children?: React.ReactNode) => {
  return render(
    <MapProvider>
      <BaseMap>{children}</BaseMap>
    </MapProvider>
  );
};

describe('BaseMap', () => {
  it('should render map container', () => {
    renderBaseMap();
    expect(screen.getByTestId('mock-map')).toBeInTheDocument();
  });

  it('should render children (layers, controls)', () => {
    renderBaseMap(<div data-testid="test-child">Test Layer</div>);

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('should handle map load event', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    renderBaseMap();

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Map loaded successfully');
    });
  });

  it('should apply custom className', () => {
    renderBaseMap();
    const mapContainer = screen.getByTestId('mock-map');
    expect(mapContainer).toBeInTheDocument();
  });
});
