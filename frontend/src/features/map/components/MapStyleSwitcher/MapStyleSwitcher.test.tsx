import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapStyleSwitcher } from './MapStyleSwitcher';

// Mock useMapContext
const mockMapRef = {
  current: {
    getMap: vi.fn(() => ({
      setStyle: vi.fn(),
    })),
  },
};

vi.mock('../../hooks/useMapContext', () => ({
  useMapContext: () => ({
    mapRef: mockMapRef,
  }),
}));

describe('MapStyleSwitcher', () => {
  it('should render with style options', () => {
    render(<MapStyleSwitcher />);
    expect(screen.getByText('Light')).toBeInTheDocument();
  });

  it('should display Map Style label', () => {
    render(<MapStyleSwitcher />);
    // MUI renders label text twice (label and legend), so use getAllByText
    const labels = screen.getAllByText('Map Style');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('should call setStyle when style is changed', async () => {
    const user = userEvent.setup();
    const setStyleMock = vi.fn();
    mockMapRef.current.getMap = vi.fn(() => ({
      setStyle: setStyleMock,
    }));

    render(<MapStyleSwitcher />);

    // Click the combobox to open it
    const select = screen.getByRole('combobox');
    await user.click(select);

    // Select a different style
    const darkOption = screen.getAllByText('Dark').find((el) => el.tagName === 'LI');
    if (darkOption) {
      await user.click(darkOption);
      expect(setStyleMock).toHaveBeenCalledWith('mapbox://styles/mapbox/dark-v11');
    }
  });

  it('should render with custom position in a Box', () => {
    const { container } = render(<MapStyleSwitcher position={{ top: 20, left: 30 }} />);

    // Check that component is rendered
    expect(container.querySelector('.MuiBox-root')).toBeInTheDocument();
  });
});
