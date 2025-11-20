import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStationIcons } from './useStationIcons';
import * as ReactMapGL from 'react-map-gl/mapbox';
import * as generateIconSVG from '../utils/generateStationIconSVG';

// Mock react-map-gl
vi.mock('react-map-gl/mapbox', () => ({
  useMap: vi.fn(),
}));

// Mock icon generator
vi.mock('../utils/generateStationIconSVG', () => ({
  generateAllStationIcons: vi.fn(),
}));

describe('useStationIcons', () => {
  let mockMap: {
    hasImage: ReturnType<typeof vi.fn>;
    addImage: ReturnType<typeof vi.fn>;
  };
  let mockUseMap: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Create mock map instance
    mockMap = {
      hasImage: vi.fn().mockReturnValue(false),
      addImage: vi.fn(),
    };

    // Mock useMap hook
    mockUseMap = vi.spyOn(ReactMapGL, 'useMap');
    mockUseMap.mockReturnValue({ current: mockMap });

    // Mock icon generator
    vi.mocked(generateIconSVG.generateAllStationIcons).mockReturnValue({
      'station-icon-default': 'data:image/svg+xml;base64,default',
      'station-icon-hover': 'data:image/svg+xml;base64,hover',
      'station-icon-active': 'data:image/svg+xml;base64,active',
    });

    // Spy on console.error
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  it('should load icons on mount', async () => {
    // Mock Image to trigger onload immediately
    const originalImage = global.Image;
    global.Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: ((error: Error) => void) | null = null;
      src = '';

      constructor() {
        // Trigger onload asynchronously
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    } as unknown as typeof Image;

    renderHook(() => useStationIcons());

    // Wait for async icon loading
    await vi.waitFor(
      () => {
        expect(mockMap.addImage).toHaveBeenCalledTimes(3);
      },
      { timeout: 1000 }
    );

    expect(mockMap.addImage).toHaveBeenCalledWith('station-icon-default', expect.any(Object));
    expect(mockMap.addImage).toHaveBeenCalledWith('station-icon-hover', expect.any(Object));
    expect(mockMap.addImage).toHaveBeenCalledWith('station-icon-active', expect.any(Object));

    // Restore original Image
    global.Image = originalImage;
  });

  it('should not reload icons if already loaded', async () => {
    // Mock Image to trigger onload immediately
    const originalImage = global.Image;
    global.Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: ((error: Error) => void) | null = null;
      src = '';

      constructor() {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    } as unknown as typeof Image;

    // First render
    const { rerender } = renderHook(() => useStationIcons());

    await vi.waitFor(
      () => {
        expect(mockMap.addImage).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );

    const firstCallCount = mockMap.addImage.mock.calls.length;

    // Rerender
    rerender();

    // Wait a bit to ensure no new calls are made
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should not load again
    expect(mockMap.addImage).toHaveBeenCalledTimes(firstCallCount);

    // Restore original Image
    global.Image = originalImage;
  });

  it('should skip icons that already exist in map', async () => {
    // Mock Image to trigger onload immediately
    const originalImage = global.Image;
    global.Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: ((error: Error) => void) | null = null;
      src = '';

      constructor() {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    } as unknown as typeof Image;

    // Mock that default icon already exists
    mockMap.hasImage.mockImplementation((name: string) => {
      return name === 'station-icon-default';
    });

    renderHook(() => useStationIcons());

    await vi.waitFor(
      () => {
        expect(mockMap.addImage).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );

    // Should only add hover and active icons
    expect(mockMap.addImage).toHaveBeenCalledTimes(2);
    expect(mockMap.addImage).not.toHaveBeenCalledWith('station-icon-default', expect.anything());

    // Restore original Image
    global.Image = originalImage;
  });

  it('should handle icon loading errors gracefully', async () => {
    // Mock image loading to fail
    const originalImage = global.Image;
    global.Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: ((error: Error) => void) | null = null;
      src = '';

      constructor() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Error('Failed to load image'));
          }
        }, 0);
      }
    } as unknown as typeof Image;

    renderHook(() => useStationIcons());

    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to load station icons:',
      expect.any(Error)
    );

    // Restore original Image
    global.Image = originalImage;
  });

  it('should not load icons when map is not available', () => {
    mockUseMap.mockReturnValue({ current: null });

    renderHook(() => useStationIcons());

    expect(mockMap.addImage).not.toHaveBeenCalled();
  });

  it('should generate icons with correct size', async () => {
    renderHook(() => useStationIcons());

    await vi.waitFor(() => {
      expect(generateIconSVG.generateAllStationIcons).toHaveBeenCalled();
    });

    expect(generateIconSVG.generateAllStationIcons).toHaveBeenCalledWith(32);
  });
});
