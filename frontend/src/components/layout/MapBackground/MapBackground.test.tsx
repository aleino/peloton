import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MapBackground } from './MapBackground';

// Mock BaseMap and MapProvider
vi.mock('@/features/map/components/BaseMap', () => ({
  BaseMap: () => <div data-testid="base-map">Map</div>,
}));

vi.mock('@/features/map/context/MapContext', () => ({
  MapProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
