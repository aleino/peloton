import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default message', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingSpinner message="Peloton" />);
    expect(screen.getByText('Peloton')).toBeInTheDocument();
  });

  it('renders spinner', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.MuiCircularProgress-root');
    expect(spinner).toBeInTheDocument();
  });

  it('should render fullscreen variant', () => {
    const { container } = render(<LoadingSpinner variant="fullscreen" message="Loading..." />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ minHeight: '100vh' });
  });

  it('should render floating variant by default', () => {
    const { container } = render(<LoadingSpinner message="Loading..." />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ position: 'absolute' });
  });

  it('should render floating variant explicitly', () => {
    const { container } = render(<LoadingSpinner variant="floating" message="Loading..." />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ position: 'absolute' });
  });

  it('should render Paper component in floating variant', () => {
    const { container } = render(<LoadingSpinner variant="floating" message="Loading..." />);
    const paper = container.querySelector('[class*="MuiPaper"]');
    expect(paper).toBeInTheDocument();
  });

  it('should not render Paper component in fullscreen variant', () => {
    const { container } = render(<LoadingSpinner variant="fullscreen" message="Loading..." />);
    const paper = container.querySelector('[class*="MuiPaper"]');
    expect(paper).not.toBeInTheDocument();
  });
});
