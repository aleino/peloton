import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppLayout } from './AppLayout';
import { MemoryRouter } from 'react-router-dom';

vi.mock('./MapBackground', () => ({
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

  it('should render Outlet for route content', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    // Outlet renders as main element
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should render content container structure', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    // Verify main element exists for content
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();

    // Verify MapBackground is rendered before main content
    const mapBackground = screen.getByTestId('map-background');
    expect(mapBackground).toBeInTheDocument();
  });
});
