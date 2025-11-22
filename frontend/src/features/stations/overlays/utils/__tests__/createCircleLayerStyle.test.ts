import { describe, it, expect } from 'vitest';
import { createCircleLayerStyle } from '../createCircleLayerStyle';
import { STATIONS_CIRCLES_LAYER_ID } from '../../config';
import { MARKER_RADIUS, MARKER_STROKE_WIDTH } from '../../config/markerSizes';

describe('createCircleLayerStyle', () => {
  it('should return correct layer configuration', () => {
    const style = createCircleLayerStyle('red');

    expect(style.id).toBe(STATIONS_CIRCLES_LAYER_ID);
    expect(style.type).toBe('circle');
    expect(style.paint).toBeDefined();
  });

  it('should have correct circle-radius expression', () => {
    const style = createCircleLayerStyle('red');
    const paint = style.paint as Record<string, unknown>;
    const circleRadius = paint['circle-radius'];

    expect(Array.isArray(circleRadius)).toBe(true);
    if (Array.isArray(circleRadius)) {
      expect(circleRadius[0]).toBe('case');
    }
  });

  it('should have correct color expression', () => {
    const style = createCircleLayerStyle('red');
    const paint = style.paint as Record<string, unknown>;
    const circleColor = paint['circle-color'];

    expect(Array.isArray(circleColor)).toBe(true);
    if (Array.isArray(circleColor)) {
      expect(circleColor[0]).toBe('coalesce');
      expect(circleColor[1]).toBe('red');
    }
  });

  it('should have transition configuration', () => {
    const style = createCircleLayerStyle('red');
    const paint = style.paint as Record<string, unknown>;

    expect(paint['circle-radius-transition']).toBeDefined();
    expect(paint['circle-stroke-width-transition']).toBeDefined();
  });

  it('should have correct stroke properties', () => {
    const style = createCircleLayerStyle('red');
    const paint = style.paint as Record<string, unknown>;

    expect(paint['circle-stroke-color']).toBe('#ffffff');
    expect(paint['circle-opacity']).toBe(0.9);
  });

  it('should handle selected state in radius expression', () => {
    const style = createCircleLayerStyle('red');
    const paint = style.paint as Record<string, unknown>;
    const circleRadius = paint['circle-radius'];

    expect(Array.isArray(circleRadius)).toBe(true);
    if (Array.isArray(circleRadius)) {
      // Check that selected state is checked
      const expression = JSON.stringify(circleRadius);
      expect(expression).toContain('selected');
      expect(expression).toContain(String(MARKER_RADIUS.SELECTED));
    }
  });

  it('should handle hover state in radius expression', () => {
    const style = createCircleLayerStyle('red');
    const paint = style.paint as Record<string, unknown>;
    const circleRadius = paint['circle-radius'];

    expect(Array.isArray(circleRadius)).toBe(true);
    if (Array.isArray(circleRadius)) {
      const expression = JSON.stringify(circleRadius);
      expect(expression).toContain('hover');
      expect(expression).toContain(String(MARKER_RADIUS.HOVER));
    }
  });

  it('should have default radius in expression', () => {
    const style = createCircleLayerStyle('red');
    const paint = style.paint as Record<string, unknown>;
    const circleRadius = paint['circle-radius'];

    expect(Array.isArray(circleRadius)).toBe(true);
    if (Array.isArray(circleRadius)) {
      const expression = JSON.stringify(circleRadius);
      expect(expression).toContain(String(MARKER_RADIUS.DEFAULT));
    }
  });

  it('should have stroke width expression', () => {
    const style = createCircleLayerStyle('red');
    const paint = style.paint as Record<string, unknown>;
    const strokeWidth = paint['circle-stroke-width'];

    expect(Array.isArray(strokeWidth)).toBe(true);
    if (Array.isArray(strokeWidth)) {
      expect(strokeWidth[0]).toBe('case');
      const expression = JSON.stringify(strokeWidth);
      expect(expression).toContain('selected');
      expect(expression).toContain('hover');
      expect(expression).toContain(String(MARKER_STROKE_WIDTH.SELECTED));
      expect(expression).toContain(String(MARKER_STROKE_WIDTH.HOVER));
      expect(expression).toContain(String(MARKER_STROKE_WIDTH.DEFAULT));
    }
  });
});
