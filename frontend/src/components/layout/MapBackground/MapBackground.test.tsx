import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MapBackground } from './MapBackground';

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

describe('MapBackground', () => {
  it('should render BaseMap inside MapProvider', () => {
    render(<MapBackground />);
    expect(screen.getByTestId('base-map')).toBeInTheDocument();
  });

  it('should have fixed positioning styles', () => {
    const { container } = render(<MapBackground />);
    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper).toHaveStyle({
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
    });
  });

  it('should have z-index 0', () => {
    const { container } = render(<MapBackground />);
    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper).toHaveStyle({
      zIndex: 0,
    });
  });
});
