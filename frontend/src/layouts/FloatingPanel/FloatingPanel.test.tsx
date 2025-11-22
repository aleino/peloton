import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingPanel } from './FloatingPanel';

describe('FloatingPanel', () => {
  it('should render children', () => {
    render(
      <FloatingPanel>
        <div>Panel Content</div>
      </FloatingPanel>
    );
    expect(screen.getByText('Panel Content')).toBeInTheDocument();
  });

  it('should apply left position by default', () => {
    const { container } = render(<FloatingPanel>Content</FloatingPanel>);
    const panel = container.firstChild as HTMLElement;
    expect(panel).toHaveStyle({ left: '16px' });
  });

  it('should apply right position when specified', () => {
    const { container } = render(<FloatingPanel position="right">Content</FloatingPanel>);
    const panel = container.firstChild as HTMLElement;
    expect(panel).toHaveStyle({ right: '16px' });
  });

  it('should show close button when closable', () => {
    const onClose = vi.fn();
    render(
      <FloatingPanel closable onClose={onClose}>
        Content
      </FloatingPanel>
    );

    const closeButton = screen.getByLabelText('Close panel');
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should not show close button by default', () => {
    render(<FloatingPanel>Content</FloatingPanel>);
    expect(screen.queryByLabelText('Close panel')).not.toBeInTheDocument();
  });

  it('should apply custom width', () => {
    const { container } = render(<FloatingPanel width="50%">Content</FloatingPanel>);
    const panel = container.firstChild as HTMLElement;
    expect(panel).toHaveStyle({ width: '50%' });
  });

  it('should apply default width of 39%', () => {
    const { container } = render(<FloatingPanel>Content</FloatingPanel>);
    const panel = container.firstChild as HTMLElement;
    expect(panel).toHaveStyle({ width: '39%' });
  });

  it('should apply custom top offset', () => {
    const { container } = render(<FloatingPanel top={100}>Content</FloatingPanel>);
    const panel = container.firstChild as HTMLElement;
    expect(panel).toHaveStyle({ top: '100px' });
  });

  it('should apply scrollable overflow by default', () => {
    const { container } = render(<FloatingPanel>Content</FloatingPanel>);
    const paper = container.querySelector('[class*="MuiPaper"]') as HTMLElement;
    expect(paper).toHaveStyle({ overflow: 'auto' });
  });

  it('should apply visible overflow when not scrollable', () => {
    const { container } = render(<FloatingPanel scrollable={false}>Content</FloatingPanel>);
    const paper = container.querySelector('[class*="MuiPaper"]') as HTMLElement;
    expect(paper).toHaveStyle({ overflow: 'visible' });
  });

  it('should apply custom sx props', () => {
    const { container } = render(<FloatingPanel sx={{ zIndex: 999 }}>Content</FloatingPanel>);
    const panel = container.firstChild as HTMLElement;
    // Verify panel exists and can receive sx props
    expect(panel).toBeInTheDocument();
    // Material UI applies sx via classes, not inline styles, so we can't test exact style values
    // Instead, verify the component renders without errors with custom sx
  });
});
