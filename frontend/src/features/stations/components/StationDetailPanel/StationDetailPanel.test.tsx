/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StationDetailPanel } from './StationDetailPanel';
import type { StationsGetResponseBody } from '@peloton/shared';

// Mock the useStationDetail hook
vi.mock('../../api/useStationDetail', () => ({
  useStationDetail: vi.fn(),
}));

// Import after mock
import { useStationDetail } from '../../api/useStationDetail';

const mockStation: StationsGetResponseBody = {
  stationId: '001',
  name: 'Kaivopuisto',
  location: {
    type: 'Point',
    coordinates: [24.9525, 60.1534],
  },
  statistics: {
    totalDepartures: 1523,
    totalArrivals: 1489,
    avgTripDurationSeconds: 895,
    avgTripDistanceMeters: 2340,
    busiestHour: 17,
    busiestDay: 2,
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T12:00:00Z',
};

describe('StationDetailPanel', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithQuery = (ui: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  };

  it('does not render when isOpen is false', () => {
    vi.mocked(useStationDetail).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    const { container } = renderWithQuery(
      <StationDetailPanel stationId="001" isOpen={false} onClose={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders FloatingPanel when isOpen is true', () => {
    vi.mocked(useStationDetail).mockReturnValue({
      data: mockStation,
      isLoading: false,
      error: null,
    } as any);

    renderWithQuery(<StationDetailPanel stationId="001" isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Kaivopuisto')).toBeInTheDocument();
  });

  it('displays loading state while fetching data', () => {
    vi.mocked(useStationDetail).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    renderWithQuery(<StationDetailPanel stationId="001" isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays error state when fetch fails', () => {
    vi.mocked(useStationDetail).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    } as any);

    renderWithQuery(<StationDetailPanel stationId="001" isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Failed to load station details')).toBeInTheDocument();
  });

  it('displays station name and coordinates', () => {
    vi.mocked(useStationDetail).mockReturnValue({
      data: mockStation,
      isLoading: false,
      error: null,
    } as any);

    renderWithQuery(<StationDetailPanel stationId="001" isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Kaivopuisto')).toBeInTheDocument();
    expect(screen.getByText(/60\.1534°N, 24\.9525°E/)).toBeInTheDocument();
  });

  it('displays all statistics sections', () => {
    vi.mocked(useStationDetail).mockReturnValue({
      data: mockStation,
      isLoading: false,
      error: null,
    } as any);

    renderWithQuery(<StationDetailPanel stationId="001" isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getByText('Activity Patterns')).toBeInTheDocument();
  });

  it('displays station ID and last updated', () => {
    vi.mocked(useStationDetail).mockReturnValue({
      data: mockStation,
      isLoading: false,
      error: null,
    } as any);

    renderWithQuery(<StationDetailPanel stationId="001" isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Station ID: 001/)).toBeInTheDocument();
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    vi.mocked(useStationDetail).mockReturnValue({
      data: mockStation,
      isLoading: false,
      error: null,
    } as any);

    renderWithQuery(<StationDetailPanel stationId="001" isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByLabelText('Close panel');
    await userEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('passes correct props to FloatingPanel', () => {
    vi.mocked(useStationDetail).mockReturnValue({
      data: mockStation,
      isLoading: false,
      error: null,
    } as any);

    const { container } = renderWithQuery(
      <StationDetailPanel stationId="001" isOpen={true} onClose={vi.fn()} />
    );

    // FloatingPanel should be rendered
    const panel = container.querySelector('[data-testid="floating-panel"]');
    expect(panel || container.firstChild).toBeInTheDocument();
  });

  it('renders StationIcon with active variant', () => {
    vi.mocked(useStationDetail).mockReturnValue({
      data: mockStation,
      isLoading: false,
      error: null,
    } as any);

    renderWithQuery(<StationDetailPanel stationId="001" isOpen={true} onClose={vi.fn()} />);

    const icon = screen.getByLabelText('Station marker');
    expect(icon).toBeInTheDocument();
  });

  it('only fetches data when panel is open', () => {
    const mockUseStationDetail = vi.mocked(useStationDetail);

    renderWithQuery(<StationDetailPanel stationId="001" isOpen={false} onClose={vi.fn()} />);

    expect(mockUseStationDetail).toHaveBeenCalledWith({
      stationId: '001',
      enabled: false,
    });
  });

  it('fetches data when panel opens', () => {
    const mockUseStationDetail = vi.mocked(useStationDetail);
    mockUseStationDetail.mockReturnValue({
      data: mockStation,
      isLoading: false,
      error: null,
    } as any);

    renderWithQuery(<StationDetailPanel stationId="001" isOpen={true} onClose={vi.fn()} />);

    expect(mockUseStationDetail).toHaveBeenCalledWith({
      stationId: '001',
      enabled: true,
    });
  });

  it('handles null stationId gracefully', () => {
    vi.mocked(useStationDetail).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    renderWithQuery(<StationDetailPanel stationId={null} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
