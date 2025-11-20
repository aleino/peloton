import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StationStats } from './StationStats';
import type { StationStatistics } from '@peloton/shared';

describe('StationStats', () => {
  const mockStatistics: StationStatistics = {
    totalDepartures: 1523,
    totalArrivals: 1489,
    avgTripDurationSeconds: 895,
    avgTripDistanceMeters: 2340,
    busiestHour: 17,
    busiestDay: 2,
  };

  it('renders all stat cards', () => {
    render(<StationStats statistics={mockStatistics} />);

    expect(screen.getByText('Departures')).toBeInTheDocument();
    expect(screen.getByText('Arrivals')).toBeInTheDocument();
    expect(screen.getByText('Avg Duration')).toBeInTheDocument();
    expect(screen.getByText('Avg Distance')).toBeInTheDocument();
  });

  it('displays departure count with locale formatting', () => {
    render(<StationStats statistics={mockStatistics} />);
    expect(screen.getByText('1,523')).toBeInTheDocument();
  });

  it('displays arrival count with locale formatting', () => {
    render(<StationStats statistics={mockStatistics} />);
    expect(screen.getByText('1,489')).toBeInTheDocument();
  });

  it('formats duration in minutes when less than 60 minutes', () => {
    const stats = { ...mockStatistics, avgTripDurationSeconds: 300 }; // 5 minutes
    render(<StationStats statistics={stats} />);
    expect(screen.getByText('5 min')).toBeInTheDocument();
  });

  it('formats duration in hours and minutes when 60+ minutes', () => {
    const stats = { ...mockStatistics, avgTripDurationSeconds: 3900 }; // 65 minutes = 1h 5m
    render(<StationStats statistics={stats} />);
    expect(screen.getByText('1h 5m')).toBeInTheDocument();
  });

  it('formats distance in meters when less than 1000m', () => {
    const stats = { ...mockStatistics, avgTripDistanceMeters: 750 };
    render(<StationStats statistics={stats} />);
    expect(screen.getByText('750 m')).toBeInTheDocument();
  });

  it('formats distance in kilometers when 1000m or more', () => {
    const stats = { ...mockStatistics, avgTripDistanceMeters: 2340 };
    render(<StationStats statistics={stats} />);
    expect(screen.getByText('2.3 km')).toBeInTheDocument();
  });

  it('renders stat cards with elevation', () => {
    const { container } = render(<StationStats statistics={mockStatistics} />);
    const papers = container.querySelectorAll('.MuiPaper-elevation1');
    expect(papers.length).toBe(4);
  });
});
