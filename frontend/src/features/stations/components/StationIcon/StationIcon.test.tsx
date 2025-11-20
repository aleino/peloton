import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { StationIcon } from './StationIcon';

// Create a test theme
const theme = createTheme();

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('StationIcon', () => {
  it('renders without errors', () => {
    renderWithTheme(<StationIcon />);
    const icon = screen.getByRole('img', { name: /station marker/i });
    expect(icon).toBeInTheDocument();
  });

  it('renders with default variant', () => {
    const { container } = renderWithTheme(<StationIcon variant="default" />);
    const iconContainer = container.firstChild;
    expect(iconContainer).toBeInTheDocument();
  });

  it('renders with hover variant', () => {
    const { container } = renderWithTheme(<StationIcon variant="hover" />);
    const iconContainer = container.firstChild;
    expect(iconContainer).toBeInTheDocument();
  });

  it('renders with active variant', () => {
    const { container } = renderWithTheme(<StationIcon variant="active" />);
    const iconContainer = container.firstChild;
    expect(iconContainer).toBeInTheDocument();
  });

  it('applies custom size prop', () => {
    const { container } = renderWithTheme(<StationIcon size={48} />);
    const iconContainer = container.firstChild as HTMLElement;

    expect(iconContainer).toHaveStyle({
      width: '48px',
      height: '48px',
    });
  });

  it('uses default size of 32 when no size prop provided', () => {
    const { container } = renderWithTheme(<StationIcon />);
    const iconContainer = container.firstChild as HTMLElement;

    expect(iconContainer).toHaveStyle({
      width: '32px',
      height: '32px',
    });
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    renderWithTheme(<StationIcon onClick={handleClick} />);
    const icon = screen.getByRole('img', { name: /station marker/i });

    await user.click(icon);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const customClass = 'custom-station-icon';
    renderWithTheme(<StationIcon className={customClass} />);
    const icon = screen.getByRole('img', { name: /station marker/i });

    expect(icon).toHaveClass(customClass);
  });

  it('has correct ARIA attributes', () => {
    renderWithTheme(<StationIcon />);
    const icon = screen.getByRole('img', { name: /station marker/i });

    expect(icon).toHaveAttribute('role', 'img');
    expect(icon).toHaveAttribute('aria-label', 'Station marker');
  });

  it('calculates icon size as 55% of container', () => {
    const containerSize = 40;
    const expectedIconSize = containerSize * 0.55;

    const { container } = renderWithTheme(<StationIcon size={containerSize} />);

    // The Bike component from lucide-react should receive the calculated size
    // We check if the SVG has the expected dimensions
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', expectedIconSize.toString());
    expect(svg).toHaveAttribute('height', expectedIconSize.toString());
  });

  it('renders with circular border radius', () => {
    const { container } = renderWithTheme(<StationIcon />);
    const iconContainer = container.firstChild as HTMLElement;

    expect(iconContainer).toHaveStyle({
      borderRadius: '50%',
    });
  });

  it('has cursor pointer style', () => {
    const { container } = renderWithTheme(<StationIcon />);
    const iconContainer = container.firstChild as HTMLElement;

    expect(iconContainer).toHaveStyle({
      cursor: 'pointer',
    });
  });
});
