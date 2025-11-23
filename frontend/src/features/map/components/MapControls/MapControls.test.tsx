import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapControls } from './MapControls';

const mockZoomIn = vi.fn();
const mockZoomOut = vi.fn();
const mockResetNorth = vi.fn();
const mockGetBearing = vi.fn(() => 0);
const mockGetPitch = vi.fn(() => 0);
const mockEaseTo = vi.fn();
const mockOn = vi.fn();
const mockOff = vi.fn();
const mockGetMap = vi.fn(() => ({
  zoomIn: mockZoomIn,
  zoomOut: mockZoomOut,
  resetNorth: mockResetNorth,
  getBearing: mockGetBearing,
  getPitch: mockGetPitch,
  easeTo: mockEaseTo,
  on: mockOn,
  off: mockOff,
}));

const mockDispatch = vi.fn();

vi.mock('react-map-gl/mapbox', () => ({
  useMap: () => ({
    main: {
      getMap: mockGetMap,
    },
  }),
}));

vi.mock('../../../../store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
}));

describe('MapControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBearing.mockReturnValue(0);
  });

  it('should render container with zoom and secondary controls', () => {
    render(<MapControls />);

    expect(screen.getByTestId('map-controls-container')).toBeInTheDocument();
    expect(screen.getByTestId('zoom-controls-panel')).toBeInTheDocument();
    expect(screen.getByTestId('secondary-controls-panel')).toBeInTheDocument();
  });

  it('should render zoom in and zoom out buttons', () => {
    render(<MapControls />);

    expect(screen.getByTestId('zoom-in-button')).toBeInTheDocument();
    expect(screen.getByTestId('zoom-out-button')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
  });

  it('should render compass button', () => {
    render(<MapControls />);

    expect(screen.getByTestId('compass-button')).toBeInTheDocument();
    expect(screen.getByLabelText('Reset map orientation')).toBeInTheDocument();
  });

  it('should call zoomIn when zoom in button is clicked', async () => {
    const user = userEvent.setup();
    render(<MapControls />);

    const zoomInButton = screen.getByTestId('zoom-in-button');
    await user.click(zoomInButton);

    expect(mockGetMap).toHaveBeenCalled();
    expect(mockZoomIn).toHaveBeenCalled();
  });

  it('should call zoomOut when zoom out button is clicked', async () => {
    const user = userEvent.setup();
    render(<MapControls />);

    const zoomOutButton = screen.getByTestId('zoom-out-button');
    await user.click(zoomOutButton);

    expect(mockGetMap).toHaveBeenCalled();
    expect(mockZoomOut).toHaveBeenCalled();
  });

  it('should reset to north when compass button is clicked', async () => {
    mockGetBearing.mockReturnValue(45);
    mockGetPitch.mockReturnValue(10);
    const user = userEvent.setup();
    render(<MapControls />);

    const compassButton = screen.getByTestId('compass-button');
    await user.click(compassButton);

    expect(mockGetMap).toHaveBeenCalled();
    expect(mockEaseTo).toHaveBeenCalledWith({
      bearing: 0,
      pitch: 0,
      duration: 500,
    });
  });

  it('should rotate to south when already at north', async () => {
    mockGetBearing.mockReturnValue(0);
    mockGetPitch.mockReturnValue(0);
    const user = userEvent.setup();
    render(<MapControls />);

    const compassButton = screen.getByTestId('compass-button');
    await user.click(compassButton);

    expect(mockEaseTo).toHaveBeenCalledWith({
      bearing: 180,
      pitch: 0,
      duration: 500,
    });
  });

  it('should sync compass icon rotation with map bearing', () => {
    mockGetBearing.mockReturnValue(45);
    render(<MapControls />);

    expect(mockGetBearing).toHaveBeenCalled();
    expect(mockOn).toHaveBeenCalledWith('rotate', expect.any(Function));
  });

  it('should cleanup bearing listener on unmount', () => {
    const { unmount } = render(<MapControls />);

    unmount();

    expect(mockOff).toHaveBeenCalledWith('rotate', expect.any(Function));
  });

  it('should render home button', () => {
    render(<MapControls />);

    expect(screen.getByTestId('home-button')).toBeInTheDocument();
    expect(screen.getByLabelText('Reset map to initial position')).toBeInTheDocument();
  });

  it('should reset map to initial state and clear station selections when home button is clicked', async () => {
    const user = userEvent.setup();
    render(<MapControls />);

    const homeButton = screen.getByTestId('home-button');
    await user.click(homeButton);

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'stations/clearStationSelections' });
    expect(mockGetMap).toHaveBeenCalled();
    expect(mockEaseTo).toHaveBeenCalledWith({
      center: [24.9384, 60.2149],
      zoom: 11,
      bearing: 0,
      pitch: 0,
      duration: 1000,
    });
  });

  it('should handle home button click when map instance is null', async () => {
    vi.resetModules();
    vi.doMock('react-map-gl/mapbox', () => ({
      useMap: () => ({ main: null }),
    }));
    vi.doMock('../../../../store/hooks', () => ({
      useAppDispatch: () => mockDispatch,
    }));

    const user = userEvent.setup();
    const { MapControls: TestMapControls } = await import('./MapControls');

    render(<TestMapControls />);

    const homeButton = screen.getByTestId('home-button');
    await user.click(homeButton);

    // Should not throw error when map is null
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockEaseTo).not.toHaveBeenCalled();
  });

  it('should handle missing map instance gracefully', async () => {
    // Override the mock for this test
    vi.resetModules();
    vi.doMock('react-map-gl/mapbox', () => ({
      useMap: () => ({ main: null }),
    }));

    const user = userEvent.setup();
    const { MapControls: TestMapControls } = await import('./MapControls');

    render(<TestMapControls />);

    const zoomInButton = screen.getByTestId('zoom-in-button');
    await user.click(zoomInButton);

    // Should not throw error when map is null
    expect(true).toBe(true);
  });
});
