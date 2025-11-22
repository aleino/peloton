import { describe, it, expect } from 'vitest';
import { createSymbolLayerStyle } from '../createSymbolLayerStyle';
import { STATIONS_SYMBOLS_LAYER_ID } from '../../config';

describe('createSymbolLayerStyle', () => {
  it('should return correct layer configuration', () => {
    const style = createSymbolLayerStyle();

    expect(style.id).toBe(STATIONS_SYMBOLS_LAYER_ID);
    expect(style.type).toBe('symbol');
    expect(style.layout).toBeDefined();
  });

  it('should have default icon configuration', () => {
    const style = createSymbolLayerStyle();
    const layout = style.layout as Record<string, unknown>;

    expect(layout['icon-image']).toBe('station-icon-default');
    expect(layout['icon-size']).toBe(1);
    expect(layout['icon-allow-overlap']).toBe(true);
  });

  it('should allow icon overlap and ignore placement', () => {
    const style = createSymbolLayerStyle();
    const layout = style.layout as Record<string, unknown>;

    expect(layout['icon-allow-overlap']).toBe(true);
    expect(layout['icon-ignore-placement']).toBe(true);
  });

  it('should be pure - same output for same input', () => {
    const style1 = createSymbolLayerStyle();
    const style2 = createSymbolLayerStyle();

    expect(style1).toEqual(style2);
  });

  it('should have correct layer type', () => {
    const style = createSymbolLayerStyle();

    expect(style.type).toBe('symbol');
  });

  it('should not have paint properties', () => {
    const style = createSymbolLayerStyle();

    expect(style.paint).toBeUndefined();
  });

  it('should have all required layout properties', () => {
    const style = createSymbolLayerStyle();

    expect(style.layout).toHaveProperty('icon-image');
    expect(style.layout).toHaveProperty('icon-size');
    expect(style.layout).toHaveProperty('icon-allow-overlap');
    expect(style.layout).toHaveProperty('icon-ignore-placement');
  });
});
