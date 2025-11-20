import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityChart } from './ActivityChart';

describe('ActivityChart', () => {
  it('renders hour chart title', () => {
    render(<ActivityChart busiestHour={17} busiestDay={2} />);
    expect(screen.getByText('Busiest Hour of Day')).toBeInTheDocument();
  });

  it('renders day chart title', () => {
    render(<ActivityChart busiestHour={17} busiestDay={2} />);
    expect(screen.getByText('Busiest Day of Week')).toBeInTheDocument();
  });

  it('renders without errors with valid data', () => {
    const { container } = render(<ActivityChart busiestHour={17} busiestDay={2} />);
    expect(container).toBeInTheDocument();
    // Recharts renders ResponsiveContainer
    const containers = container.querySelectorAll('.recharts-responsive-container');
    expect(containers.length).toBe(2); // One for hour, one for day
  });

  it('handles edge case: busiest hour is midnight (0)', () => {
    const { container } = render(<ActivityChart busiestHour={0} busiestDay={2} />);
    expect(container).toBeInTheDocument();
    expect(screen.getByText('Busiest Hour of Day')).toBeInTheDocument();
  });

  it('handles edge case: busiest hour is 23', () => {
    const { container } = render(<ActivityChart busiestHour={23} busiestDay={2} />);
    expect(container).toBeInTheDocument();
    expect(screen.getByText('Busiest Hour of Day')).toBeInTheDocument();
  });

  it('handles edge case: busiest day is Sunday (0)', () => {
    const { container } = render(<ActivityChart busiestHour={17} busiestDay={0} />);
    expect(container).toBeInTheDocument();
    expect(screen.getByText('Busiest Day of Week')).toBeInTheDocument();
  });

  it('handles edge case: busiest day is Saturday (6)', () => {
    const { container } = render(<ActivityChart busiestHour={17} busiestDay={6} />);
    expect(container).toBeInTheDocument();
    expect(screen.getByText('Busiest Day of Week')).toBeInTheDocument();
  });

  it('accepts valid hour range (0-23)', () => {
    expect(() => render(<ActivityChart busiestHour={0} busiestDay={2} />)).not.toThrow();
    expect(() => render(<ActivityChart busiestHour={23} busiestDay={2} />)).not.toThrow();
  });

  it('accepts valid day range (0-6)', () => {
    expect(() => render(<ActivityChart busiestHour={17} busiestDay={0} />)).not.toThrow();
    expect(() => render(<ActivityChart busiestHour={17} busiestDay={6} />)).not.toThrow();
  });
});
