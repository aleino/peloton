import { describe, it, expect } from 'vitest';
import { useStationEventHandlers, useIconExpression, useStationIcons } from '../index';

describe('Station Overlay Hooks Integration', () => {
  it('should export useStationEventHandlers', () => {
    expect(useStationEventHandlers).toBeDefined();
    expect(typeof useStationEventHandlers).toBe('function');
  });

  it('should export useIconExpression', () => {
    expect(useIconExpression).toBeDefined();
    expect(typeof useIconExpression).toBe('function');
  });

  it('should export useStationIcons', () => {
    expect(useStationIcons).toBeDefined();
    expect(typeof useStationIcons).toBe('function');
  });

  it('should export all hooks', () => {
    const hooks = {
      useStationEventHandlers,
      useIconExpression,
      useStationIcons,
    };

    Object.values(hooks).forEach((hook) => {
      expect(hook).toBeDefined();
      expect(typeof hook).toBe('function');
    });
  });
});
