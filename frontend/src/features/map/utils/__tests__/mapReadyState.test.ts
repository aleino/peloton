import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitForLayer, waitForSource } from '../mapReadyState';
import type { MapRef } from 'react-map-gl/mapbox';

describe('mapReadyState', () => {
  let mockMap: Partial<MapRef>;

  beforeEach(() => {
    mockMap = {
      getLayer: vi.fn(),
      getSource: vi.fn(),
      once: vi.fn() as unknown as MapRef['once'],
      off: vi.fn() as unknown as MapRef['off'],
    };
  });
  describe('waitForLayer', () => {
    it('should execute callback immediately if layer exists', () => {
      const callback = vi.fn();
      mockMap.getLayer = vi.fn().mockReturnValue({ id: 'test-layer' });

      waitForLayer(mockMap as MapRef, 'test-layer', callback);

      expect(callback).toHaveBeenCalled();
      expect(mockMap.once).not.toHaveBeenCalled();
    });

    it('should wait for idle event if layer does not exist', () => {
      const callback = vi.fn();
      mockMap.getLayer = vi.fn().mockReturnValue(null);

      waitForLayer(mockMap as MapRef, 'test-layer', callback);

      expect(callback).not.toHaveBeenCalled();
      expect(mockMap.once).toHaveBeenCalledWith('idle', expect.any(Function));
    });

    it('should return cleanup function', () => {
      const cleanup = vi.fn();
      const callback = vi.fn().mockReturnValue(cleanup);
      mockMap.getLayer = vi.fn().mockReturnValue({ id: 'test-layer' });

      const cleanupFn = waitForLayer(mockMap as MapRef, 'test-layer', callback);
      cleanupFn();

      expect(cleanup).toHaveBeenCalled();
    });

    it('should execute callback when idle event fires', () => {
      const callback = vi.fn();
      let idleHandler: (() => void) | undefined;

      mockMap.getLayer = vi.fn().mockReturnValue(null);
      mockMap.once = vi.fn((event, handler) => {
        if (event === 'idle') {
          idleHandler = handler as () => void;
        }
      }) as unknown as MapRef['once'];

      waitForLayer(mockMap as MapRef, 'test-layer', callback);

      expect(callback).not.toHaveBeenCalled();

      // Simulate layer becoming available
      mockMap.getLayer = vi.fn().mockReturnValue({ id: 'test-layer' });
      idleHandler?.();

      expect(callback).toHaveBeenCalled();
    });

    it('should remove event listener on cleanup', () => {
      const callback = vi.fn();
      mockMap.getLayer = vi.fn().mockReturnValue({ id: 'test-layer' });

      const cleanupFn = waitForLayer(mockMap as MapRef, 'test-layer', callback);
      cleanupFn();

      expect(mockMap.off).toHaveBeenCalledWith('idle', expect.any(Function));
    });
  });

  describe('waitForSource', () => {
    it('should execute callback immediately if source exists', () => {
      const callback = vi.fn();
      mockMap.getSource = vi.fn().mockReturnValue({ type: 'geojson' });

      waitForSource(mockMap as MapRef, 'test-source', callback);

      expect(callback).toHaveBeenCalled();
      expect(mockMap.once).not.toHaveBeenCalled();
    });

    it('should wait for idle event if source does not exist', () => {
      const callback = vi.fn();
      mockMap.getSource = vi.fn().mockReturnValue(null);

      waitForSource(mockMap as MapRef, 'test-source', callback);

      expect(callback).not.toHaveBeenCalled();
      expect(mockMap.once).toHaveBeenCalledWith('idle', expect.any(Function));
    });

    it('should return cleanup function', () => {
      const cleanup = vi.fn();
      const callback = vi.fn().mockReturnValue(cleanup);
      mockMap.getSource = vi.fn().mockReturnValue({ type: 'geojson' });

      const cleanupFn = waitForSource(mockMap as MapRef, 'test-source', callback);
      cleanupFn();

      expect(cleanup).toHaveBeenCalled();
    });

    it('should execute callback when idle event fires', () => {
      const callback = vi.fn();
      let idleHandler: (() => void) | undefined;

      mockMap.getSource = vi.fn().mockReturnValue(null);
      mockMap.once = vi.fn((event, handler) => {
        if (event === 'idle') {
          idleHandler = handler as () => void;
        }
      }) as unknown as MapRef['once'];

      waitForSource(mockMap as MapRef, 'test-source', callback);

      expect(callback).not.toHaveBeenCalled();

      // Simulate source becoming available
      mockMap.getSource = vi.fn().mockReturnValue({ type: 'geojson' });
      idleHandler?.();

      expect(callback).toHaveBeenCalled();
    });

    it('should remove event listener on cleanup', () => {
      const callback = vi.fn();
      mockMap.getSource = vi.fn().mockReturnValue({ type: 'geojson' });

      const cleanupFn = waitForSource(mockMap as MapRef, 'test-source', callback);
      cleanupFn();

      expect(mockMap.off).toHaveBeenCalledWith('idle', expect.any(Function));
    });
  });
});
