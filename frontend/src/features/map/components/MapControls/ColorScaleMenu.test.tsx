import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { ColorScaleMenu } from './ColorScaleMenu';

// Create a test theme with alpha palette
const theme = createTheme({
  palette: {
    alpha: {
      4: 'rgba(0, 0, 0, 0.04)',
      8: 'rgba(0, 0, 0, 0.08)',
      12: 'rgba(0, 0, 0, 0.12)',
      24: 'rgba(0, 0, 0, 0.24)',
    },
  },
});

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('ColorScaleMenu', () => {
  it('renders all color scale options', () => {
    const onSelect = vi.fn();
    renderWithTheme(<ColorScaleMenu selectedColorScale="quantile" onSelect={onSelect} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
  });

  it('calls onSelect with correct value when option clicked', () => {
    const onSelect = vi.fn();
    renderWithTheme(<ColorScaleMenu selectedColorScale="quantile" onSelect={onSelect} />);

    const linearButton = screen.getByLabelText('Linear');
    fireEvent.click(linearButton);

    expect(onSelect).toHaveBeenCalledWith('linear');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('displays tooltips with descriptions', () => {
    const onSelect = vi.fn();
    renderWithTheme(<ColorScaleMenu selectedColorScale="quantile" onSelect={onSelect} />);

    const linearButton = screen.getByLabelText('Linear');
    expect(linearButton).toHaveAttribute('title', 'Linear: Even distribution across value range');
  });

  it('renders correct icons for each scale type', () => {
    const onSelect = vi.fn();
    const { container } = renderWithTheme(
      <ColorScaleMenu selectedColorScale="linear" onSelect={onSelect} />
    );

    // Check that SVG icons are rendered (Lucide icons render as SVG)
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(4);
  });
});
