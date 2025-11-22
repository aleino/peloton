import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  batchUpdateFeatureStates,
  clearFeatureStateProperties,
  clearAllFeatureStates,
} from '../featureStateManager';
import type { MapRef } from 'react-map-gl/mapbox';

describe('featureStateManager', () => {
  let mockMap: Partial<MapRef>;

  beforeEach(() => {
    mockMap = {
      setFeatureState: vi.fn(),
      removeFeatureState: vi.fn(),
      triggerRepaint: vi.fn(),
    };
  });

  describe('batchUpdateFeatureStates', () => {
    it('should apply all feature states', () => {
      const updates = [
        { featureId: 'station-1', state: { hover: true } },
        { featureId: 'station-2', state: { selected: true } },
      ];

      batchUpdateFeatureStates(mockMap as MapRef, 'test-source', updates);

      expect(mockMap.setFeatureState).toHaveBeenCalledTimes(2);
      expect(mockMap.setFeatureState).toHaveBeenCalledWith(
        { source: 'test-source', id: 'station-1' },
        { hover: true }
      );
      expect(mockMap.setFeatureState).toHaveBeenCalledWith(
        { source: 'test-source', id: 'station-2' },
        { selected: true }
      );
    });

    it('should trigger single repaint after updates', () => {
      const updates = [{ featureId: 'station-1', state: { hover: true } }];

      batchUpdateFeatureStates(mockMap as MapRef, 'test-source', updates);

      expect(mockMap.triggerRepaint).toHaveBeenCalledOnce();
    });

    it('should handle empty updates array', () => {
      batchUpdateFeatureStates(mockMap as MapRef, 'test-source', []);

      expect(mockMap.setFeatureState).not.toHaveBeenCalled();
      expect(mockMap.triggerRepaint).toHaveBeenCalledOnce();
    });

    it('should handle numeric feature IDs', () => {
      const updates = [{ featureId: 123, state: { hover: true } }];

      batchUpdateFeatureStates(mockMap as MapRef, 'test-source', updates);

      expect(mockMap.setFeatureState).toHaveBeenCalledWith(
        { source: 'test-source', id: 123 },
        { hover: true }
      );
    });
  });

  describe('clearFeatureStateProperties', () => {
    it('should clear specified properties for all features', () => {
      clearFeatureStateProperties(
        mockMap as MapRef,
        'test-source',
        ['station-1', 'station-2'],
        ['hover', 'selected']
      );

      expect(mockMap.removeFeatureState).toHaveBeenCalledTimes(4); // 2 features * 2 properties
      expect(mockMap.removeFeatureState).toHaveBeenCalledWith(
        { source: 'test-source', id: 'station-1' },
        'hover'
      );
      expect(mockMap.removeFeatureState).toHaveBeenCalledWith(
        { source: 'test-source', id: 'station-1' },
        'selected'
      );
      expect(mockMap.removeFeatureState).toHaveBeenCalledWith(
        { source: 'test-source', id: 'station-2' },
        'hover'
      );
      expect(mockMap.removeFeatureState).toHaveBeenCalledWith(
        { source: 'test-source', id: 'station-2' },
        'selected'
      );
    });

    it('should handle empty feature IDs array', () => {
      clearFeatureStateProperties(mockMap as MapRef, 'test-source', [], ['hover']);

      expect(mockMap.removeFeatureState).not.toHaveBeenCalled();
    });

    it('should handle empty properties array', () => {
      clearFeatureStateProperties(mockMap as MapRef, 'test-source', ['station-1'], []);

      expect(mockMap.removeFeatureState).not.toHaveBeenCalled();
    });

    it('should handle numeric feature IDs', () => {
      clearFeatureStateProperties(mockMap as MapRef, 'test-source', [123, 456], ['hover']);

      expect(mockMap.removeFeatureState).toHaveBeenCalledTimes(2);
      expect(mockMap.removeFeatureState).toHaveBeenCalledWith(
        { source: 'test-source', id: 123 },
        'hover'
      );
      expect(mockMap.removeFeatureState).toHaveBeenCalledWith(
        { source: 'test-source', id: 456 },
        'hover'
      );
    });
  });

  describe('clearAllFeatureStates', () => {
    it('should clear all feature states for source', () => {
      clearAllFeatureStates(mockMap as MapRef, 'test-source');

      expect(mockMap.removeFeatureState).toHaveBeenCalledWith({ source: 'test-source' });
    });

    it('should be called only once', () => {
      clearAllFeatureStates(mockMap as MapRef, 'test-source');

      expect(mockMap.removeFeatureState).toHaveBeenCalledOnce();
    });
  });
});
