import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapResetButton } from './MapResetButton';

// Mock useMapContext
const mockResetView = vi.fn();

vi.mock('../../hooks/useMapContext', () => ({
  useMapContext: () => ({
    resetView: mockResetView,
  }),
}));

describe('MapResetButton', () => {
  it('should render reset button', () => {
    render(<MapResetButton />);
    expect(screen.getByRole('button', { name: /reset map view/i })).toBeInTheDocument();
  });

  it('should call resetView when clicked', async () => {
    const user = userEvent.setup();
    render(<MapResetButton />);

    const button = screen.getByRole('button', { name: /reset map view/i });
    await user.click(button);

    expect(mockResetView).toHaveBeenCalledTimes(1);
  });

  it('should display tooltip on hover', async () => {
    const user = userEvent.setup();
    render(<MapResetButton />);

    const button = screen.getByRole('button', { name: /reset map view/i });
    await user.hover(button);

    expect(await screen.findByText('Reset to initial view')).toBeInTheDocument();
  });

  it('should render with custom position', () => {
    const { container } = render(<MapResetButton position={{ bottom: 50, left: 20 }} />);

    // Check that Paper component is rendered
    const paper = container.querySelector('.MuiPaper-root');
    expect(paper).toBeInTheDocument();
  });
});
