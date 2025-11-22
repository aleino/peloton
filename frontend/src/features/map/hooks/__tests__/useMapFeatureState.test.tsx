import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMapFeatureState } from '../useMapFeatureState';
import type { MapRef } from 'react-map-gl/mapbox';

const mockUseMap = vi.fn();

vi.mock('react-map-gl/mapbox', () => ({
  useMap: () => mockUseMap(),
}));

vi.mock('../../utils', () => ({
  waitForLayer: vi.fn((_map, _layerId, callback) => {
    callback();
    return () => {};
  }),
  batchUpdateFeatureStates: vi.fn(),
}));

describe('useMapFeatureState', () => {
  let mockMap: Partial<MapRef>;

  beforeEach(() => {
    mockMap = {
      getLayer: vi.fn().mockReturnValue({ id: 'test-layer' }),
      setFeatureState: vi.fn(),
      triggerRepaint: vi.fn(),
      once: vi.fn(),
      off: vi.fn(),
    };

    mockUseMap.mockReturnValue({ main: mockMap as MapRef });
  });

  it('should apply feature state updates', async () => {
    const { batchUpdateFeatureStates } = await import('../../utils');

    type TestState = Record<string, boolean>;

    const updates = [
      { featureId: 'feature-1', state: { active: true } },
      { featureId: 'feature-2', state: { active: false } },
    ];

    renderHook(() =>
      useMapFeatureState<TestState>({
        sourceId: 'test-source',
        layerId: 'test-layer',
        updates,
      })
    );

    expect(batchUpdateFeatureStates).toHaveBeenCalledWith(mockMap, 'test-source', updates);
  });

  it('should not apply updates when disabled', async () => {
    const { batchUpdateFeatureStates } = await import('../../utils');

    vi.mocked(batchUpdateFeatureStates).mockClear();

    const updates = [{ featureId: 'feature-1', state: { active: true } }];

    renderHook(() =>
      useMapFeatureState({
        sourceId: 'test-source',
        layerId: 'test-layer',
        updates,
        enabled: false,
      })
    );

    expect(batchUpdateFeatureStates).not.toHaveBeenCalled();
  });

  it('should not apply updates when array is empty', async () => {
    const { batchUpdateFeatureStates } = await import('../../utils');

    vi.mocked(batchUpdateFeatureStates).mockClear();

    renderHook(() =>
      useMapFeatureState({
        sourceId: 'test-source',
        layerId: 'test-layer',
        updates: [],
      })
    );

    expect(batchUpdateFeatureStates).not.toHaveBeenCalled();
  });

  it('should handle missing map gracefully', async () => {
    const { batchUpdateFeatureStates } = await import('../../utils');

    mockUseMap.mockReturnValue({ main: null });
    vi.mocked(batchUpdateFeatureStates).mockClear();

    const updates = [{ featureId: 'feature-1', state: { active: true } }];

    expect(() =>
      renderHook(() =>
        useMapFeatureState({
          sourceId: 'test-source',
          layerId: 'test-layer',
          updates,
        })
      )
    ).not.toThrow();

    expect(batchUpdateFeatureStates).not.toHaveBeenCalled();
  });

  it('should support complex state objects', async () => {
    const { batchUpdateFeatureStates } = await import('../../utils');

    type ComplexState = Record<string, boolean | string | number>;

    const updates = [
      {
        featureId: 'feature-1',
        state: {
          hover: true,
          selected: false,
          color: '#ff0000',
          opacity: 0.8,
        },
      },
    ];

    renderHook(() =>
      useMapFeatureState<ComplexState>({
        sourceId: 'test-source',
        layerId: 'test-layer',
        updates,
      })
    );

    expect(batchUpdateFeatureStates).toHaveBeenCalledWith(mockMap, 'test-source', updates);
  });

  it('should handle string and number feature IDs', async () => {
    const { batchUpdateFeatureStates } = await import('../../utils');

    const updates = [
      { featureId: 'string-id', state: { active: true } },
      { featureId: 123, state: { active: false } },
    ];

    renderHook(() =>
      useMapFeatureState({
        sourceId: 'test-source',
        layerId: 'test-layer',
        updates,
      })
    );

    expect(batchUpdateFeatureStates).toHaveBeenCalledWith(mockMap, 'test-source', updates);
  });

  it('should wait for layer to be ready before applying updates', async () => {
    const { waitForLayer, batchUpdateFeatureStates } = await import('../../utils');

    vi.mocked(waitForLayer).mockClear();
    vi.mocked(batchUpdateFeatureStates).mockClear();

    const updates = [{ featureId: 'feature-1', state: { active: true } }];

    renderHook(() =>
      useMapFeatureState({
        sourceId: 'test-source',
        layerId: 'test-layer',
        updates,
      })
    );

    expect(waitForLayer).toHaveBeenCalledWith(mockMap, 'test-layer', expect.any(Function));
  });
});
