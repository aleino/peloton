import { describe, it, expect } from 'vitest';
import { useLayerEvents, useMapFeatureState } from '../index';

describe('Map Hooks Integration', () => {
  it('should export useLayerEvents', () => {
    expect(useLayerEvents).toBeDefined();
    expect(typeof useLayerEvents).toBe('function');
  });

  it('should export useMapFeatureState', () => {
    expect(useMapFeatureState).toBeDefined();
    expect(typeof useMapFeatureState).toBe('function');
  });

  // TODO: Add integration tests with actual Mapbox map
  // These tests would verify:
  // 1. useLayerEvents + useMapFeatureState working together
  // 2. Real event handling with feature state changes
  // 3. Performance of batched updates in real scenarios
  // 4. Cleanup behavior across both hooks
});
