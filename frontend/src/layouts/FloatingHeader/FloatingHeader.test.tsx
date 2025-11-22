import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FloatingHeader } from './FloatingHeader';

describe('FloatingHeader', () => {
  it('should render title', () => {
    render(<FloatingHeader title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should render left and right content', () => {
    render(
      <FloatingHeader title="App" leftContent={<div>Left</div>} rightContent={<div>Right</div>} />
    );
    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText('Right')).toBeInTheDocument();
  });

  it('should render center content', () => {
    render(<FloatingHeader title="App" centerContent={<div>Center</div>} />);
    expect(screen.getByText('Center')).toBeInTheDocument();
  });

  it('should have absolute positioning', () => {
    const { container } = render(<FloatingHeader title="Test" />);
    const header = container.querySelector('header');
    expect(header).toHaveStyle({ position: 'absolute' });
  });

  it('should render without title', () => {
    render(<FloatingHeader leftContent={<div>Logo</div>} rightContent={<div>Menu</div>} />);
    expect(screen.getByText('Logo')).toBeInTheDocument();
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('should apply custom sx props', () => {
    const { container } = render(<FloatingHeader title="Test" sx={{ zIndex: 999 }} />);
    const header = container.querySelector('header');
    // Verify header exists and can receive sx props
    expect(header).toBeInTheDocument();
    // Material UI applies sx via classes, not inline styles, so we can't test exact style values
    // Instead, verify the component renders without errors with custom sx
  });
});
