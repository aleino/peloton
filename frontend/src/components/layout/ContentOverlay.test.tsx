import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContentOverlay } from './ContentOverlay';

describe('ContentOverlay', () => {
  it('should render children', () => {
    render(
      <ContentOverlay>
        <div>Test Content</div>
      </ContentOverlay>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply position styles', () => {
    const { container } = render(
      <ContentOverlay position={{ top: 100, left: 50 }}>
        <div>Content</div>
      </ContentOverlay>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({
      position: 'absolute',
    });
  });

  it('should apply width prop', () => {
    const { container } = render(
      <ContentOverlay width={350}>
        <div>Content</div>
      </ContentOverlay>
    );

    // Find the Paper component (child of Box wrapper)
    const paper = container.querySelector('[class*="MuiPaper"]');
    expect(paper).toBeInTheDocument();
  });

  it('should support maxHeight prop', () => {
    render(
      <ContentOverlay maxHeight="500px">
        <div>Content</div>
      </ContentOverlay>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should support maxWidth prop', () => {
    render(
      <ContentOverlay maxWidth="600px">
        <div>Content</div>
      </ContentOverlay>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should support scrollable mode', () => {
    render(
      <ContentOverlay scrollable maxHeight="500px">
        <div>Scrollable Content</div>
      </ContentOverlay>
    );

    expect(screen.getByText('Scrollable Content')).toBeInTheDocument();
  });

  it('should apply custom sx prop', () => {
    const { container } = render(
      <ContentOverlay sx={{ marginTop: 2 }}>
        <div>Content</div>
      </ContentOverlay>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeInTheDocument();
  });
});
