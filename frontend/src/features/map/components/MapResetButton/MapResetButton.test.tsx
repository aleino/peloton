import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapResetButton } from './MapResetButton';

// Mock react-map-gl useMap hook
const mockFlyTo = vi.fn();
const mockMain = {
  flyTo: mockFlyTo,
};

vi.mock('react-map-gl/mapbox', () => ({
  useMap: () => ({
    main: mockMain,
  }),
}));

describe('MapResetButton', () => {
  it('should render reset button', () => {
    render(<MapResetButton />);
    expect(screen.getByRole('button', { name: /reset map view/i })).toBeInTheDocument();
  });

  it('should call flyTo when clicked', async () => {
    const user = userEvent.setup();
    render(<MapResetButton />);

    const button = screen.getByRole('button', { name: /reset map view/i });
    await user.click(button);

    expect(mockFlyTo).toHaveBeenCalledTimes(1);
    expect(mockFlyTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: expect.any(Array),
        zoom: expect.any(Number),
      })
    );
  });

  it('should display tooltip on hover', async () => {
    const user = userEvent.setup();
    render(<MapResetButton />);

    const button = screen.getByRole('button', { name: /reset map view/i });
    await user.hover(button);

    expect(await screen.findByText('Reset to initial view')).toBeInTheDocument();
  });
});
