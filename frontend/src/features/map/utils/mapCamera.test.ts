import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flyToVisibleArea, jumpToVisibleArea } from '@/features/map/utils/mapCamera';
import type { MapRef } from 'react-map-gl/mapbox';

describe('mapCamera utilities', () => {
  let mockMap: MapRef;
  let flyToSpy: ReturnType<typeof vi.fn>;
  let jumpToSpy: ReturnType<typeof vi.fn>;
  let getZoomSpy: ReturnType<typeof vi.fn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    flyToSpy = vi.fn();
    jumpToSpy = vi.fn();
    getZoomSpy = vi.fn().mockReturnValue(10);

    mockMap = {
      flyTo: flyToSpy,
      jumpTo: jumpToSpy,
      getZoom: getZoomSpy,
    } as unknown as MapRef;

    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('flyToVisibleArea', () => {
    it('should call map.flyTo with correct parameters', () => {
      const options = {
        longitude: 24.9384,
        latitude: 60.1699,
        zoom: 14,
        duration: 1000,
        padding: { top: 64, bottom: 0, left: 390, right: 0 },
      };

      flyToVisibleArea(mockMap, options);

      expect(flyToSpy).toHaveBeenCalledWith({
        center: [24.9384, 60.1699],
        zoom: 14,
        duration: 1000,
        padding: { top: 64, bottom: 0, left: 390, right: 0 },
        essential: true,
      });
    });

    it('should use default duration of 1000ms if not provided', () => {
      const options = {
        longitude: 24.9384,
        latitude: 60.1699,
        zoom: 14,
        padding: { top: 64, bottom: 0, left: 390, right: 0 },
      };

      flyToVisibleArea(mockMap, options);

      expect(flyToSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 1000,
        })
      );
    });

    it('should use current zoom if zoom is not provided', () => {
      const options = {
        longitude: 24.9384,
        latitude: 60.1699,
        padding: { top: 64, bottom: 0, left: 390, right: 0 },
      };

      flyToVisibleArea(mockMap, options);

      expect(getZoomSpy).toHaveBeenCalled();
      expect(flyToSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          zoom: 10, // Mocked current zoom
        })
      );
    });

    it('should use zero padding if not provided', () => {
      const options = {
        longitude: 24.9384,
        latitude: 60.1699,
        zoom: 14,
      };

      flyToVisibleArea(mockMap, options);

      expect(flyToSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          padding: { top: 0, bottom: 0, left: 0, right: 0 },
        })
      );
    });

    it('should set essential to true', () => {
      const options = {
        longitude: 24.9384,
        latitude: 60.1699,
        zoom: 14,
      };

      flyToVisibleArea(mockMap, options);

      expect(flyToSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          essential: true,
        })
      );
    });

    it('should warn and return early if map is undefined', () => {
      const options = {
        longitude: 24.9384,
        latitude: 60.1699,
        zoom: 14,
      };

      flyToVisibleArea(undefined, options);

      expect(consoleWarnSpy).toHaveBeenCalledWith('Map instance not available');
      expect(flyToSpy).not.toHaveBeenCalled();
    });

    it('should handle custom duration', () => {
      const options = {
        longitude: 24.9384,
        latitude: 60.1699,
        zoom: 14,
        duration: 500,
      };

      flyToVisibleArea(mockMap, options);

      expect(flyToSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 500,
        })
      );
    });

    it('should handle partial padding', () => {
      const options = {
        longitude: 24.9384,
        latitude: 60.1699,
        zoom: 14,
        padding: { top: 100, bottom: 50, left: 200, right: 150 },
      };

      flyToVisibleArea(mockMap, options);

      expect(flyToSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          padding: { top: 100, bottom: 50, left: 200, right: 150 },
        })
      );
    });
  });

  describe('jumpToVisibleArea', () => {
    it('should call map.jumpTo with correct parameters', () => {
      const options = {
        longitude: 24.9384,
        latitude: 60.1699,
        zoom: 14,
        padding: { top: 64, bottom: 0, left: 390, right: 0 },
      };

      jumpToVisibleArea(mockMap, options);

      expect(jumpToSpy).toHaveBeenCalledWith({
        center: [24.9384, 60.1699],
        zoom: 14,
        padding: { top: 64, bottom: 0, left: 390, right: 0 },
      });
    });

    it('should use current zoom if zoom is not provided', () => {
      const options = {
        longitude: 24.9384,
        latitude: 60.1699,
        padding: { top: 64, bottom: 0, left: 390, right: 0 },
      };

      jumpToVisibleArea(mockMap, options);

      expect(getZoomSpy).toHaveBeenCalled();
      expect(jumpToSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          zoom: 10, // Mocked current zoom
        })
      );
    });

    it('should use zero padding if not provided', () => {
      const options = {
        longitude: 24.9384,
        latitude: 60.1699,
        zoom: 14,
      };

      jumpToVisibleArea(mockMap, options);

      expect(jumpToSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          padding: { top: 0, bottom: 0, left: 0, right: 0 },
        })
      );
    });

    it('should warn and return early if map is undefined', () => {
      const options = {
        longitude: 24.9384,
        latitude: 60.1699,
        zoom: 14,
      };

      jumpToVisibleArea(undefined, options);

      expect(consoleWarnSpy).toHaveBeenCalledWith('Map instance not available');
      expect(jumpToSpy).not.toHaveBeenCalled();
    });

    it('should not include duration parameter', () => {
      const options = {
        longitude: 24.9384,
        latitude: 60.1699,
        zoom: 14,
      };

      jumpToVisibleArea(mockMap, options);

      expect(jumpToSpy).toHaveBeenCalledWith(
        expect.not.objectContaining({
          duration: expect.anything(),
        })
      );
    });

    it('should not include essential parameter', () => {
      const options = {
        longitude: 24.9384,
        latitude: 60.1699,
        zoom: 14,
      };

      jumpToVisibleArea(mockMap, options);

      expect(jumpToSpy).toHaveBeenCalledWith(
        expect.not.objectContaining({
          essential: expect.anything(),
        })
      );
    });
  });
});
