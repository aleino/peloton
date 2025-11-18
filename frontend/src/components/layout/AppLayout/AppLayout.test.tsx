import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppLayout } from './AppLayout';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../MapBackground/MapBackground', () => ({
  MapBackground: () => <div data-testid="map-background">Map Background</div>,
}));

describe('AppLayout', () => {
  it('should render MapBackground', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    expect(screen.getByTestId('map-background')).toBeInTheDocument();
  });

  it('should render Outlet without blocking container', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    // MapBackground should be present
    expect(screen.getByTestId('map-background')).toBeInTheDocument();

    // No wrapping Box elements should exist (container has been removed)
    const { container } = render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    // Verify simple structure: just MapBackground and Outlet
    const boxes = container.querySelectorAll('[class*="MuiBox"]');
    // Should only find MapBackground's box, no content wrapper
    expect(boxes.length).toBeLessThanOrEqual(1);
  });

  it('should render without content wrapper blocking map', () => {
    const { container } = render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    // Verify MapBackground is rendered
    const mapBackground = screen.getByTestId('map-background');
    expect(mapBackground).toBeInTheDocument();

    // Verify no main element wrapper exists anymore
    const mainElement = container.querySelector('main');
    expect(mainElement).not.toBeInTheDocument();
  });
});
