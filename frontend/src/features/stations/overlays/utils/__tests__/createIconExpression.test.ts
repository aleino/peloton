import { describe, it, expect } from 'vitest';
import { createIconExpression } from '../createIconExpression';

describe('createIconExpression', () => {
  it('should return default icon when no state', () => {
    const expression = createIconExpression(null, null);
    expect(expression).toBe('station-icon-default');
  });

  it('should return expression with selected state', () => {
    const expression = createIconExpression('station-123', null);

    expect(Array.isArray(expression)).toBe(true);
    if (Array.isArray(expression)) {
      expect(expression[0]).toBe('case');
      expect(expression).toContain('station-icon-active');
    }
  });

  it('should return expression with hover state', () => {
    const expression = createIconExpression(null, 'station-456');

    expect(Array.isArray(expression)).toBe(true);
    if (Array.isArray(expression)) {
      expect(expression[0]).toBe('case');
      expect(expression).toContain('station-icon-hover');
    }
  });

  it('should handle both selected and hovered states', () => {
    const expression = createIconExpression('station-123', 'station-456');

    expect(Array.isArray(expression)).toBe(true);
    if (Array.isArray(expression)) {
      expect(expression).toContain('station-icon-active');
      expect(expression).toContain('station-icon-hover');
    }
  });

  it('should have default as fallback', () => {
    const expression = createIconExpression('station-123', null);

    expect(Array.isArray(expression)).toBe(true);
    if (Array.isArray(expression)) {
      const lastElement = expression[expression.length - 1];
      expect(lastElement).toBe('station-icon-default');
    }
  });

  it('should check stationId property in expression', () => {
    const expression = createIconExpression('station-123', null);

    expect(Array.isArray(expression)).toBe(true);
    if (Array.isArray(expression)) {
      const expressionStr = JSON.stringify(expression);
      expect(expressionStr).toContain('stationId');
    }
  });

  it('should be pure - same inputs produce same outputs', () => {
    const expr1 = createIconExpression('station-123', 'station-456');
    const expr2 = createIconExpression('station-123', 'station-456');

    expect(expr1).toEqual(expr2);
  });

  it('should handle selected station correctly', () => {
    const expression = createIconExpression('station-999', null);

    expect(Array.isArray(expression)).toBe(true);
    if (Array.isArray(expression)) {
      const expressionStr = JSON.stringify(expression);
      expect(expressionStr).toContain('station-999');
      expect(expressionStr).toContain('station-icon-active');
    }
  });

  it('should handle hovered station correctly', () => {
    const expression = createIconExpression(null, 'station-777');

    expect(Array.isArray(expression)).toBe(true);
    if (Array.isArray(expression)) {
      const expressionStr = JSON.stringify(expression);
      expect(expressionStr).toContain('station-777');
      expect(expressionStr).toContain('station-icon-hover');
    }
  });

  it('should use mapbox case expression format', () => {
    const expression = createIconExpression('station-123', 'station-456');

    expect(Array.isArray(expression)).toBe(true);
    if (Array.isArray(expression)) {
      expect(expression[0]).toBe('case');
      // Case expression format: ['case', condition1, result1, condition2, result2, ..., fallback]
      expect(expression.length).toBeGreaterThan(2);
    }
  });

  it('should prioritize selected over hover in same station', () => {
    const sameStationId = 'station-same';
    const expression = createIconExpression(sameStationId, sameStationId);

    expect(Array.isArray(expression)).toBe(true);
    if (Array.isArray(expression)) {
      const expressionStr = JSON.stringify(expression);
      // Selected should appear first in the case expression
      const activeIndex = expressionStr.indexOf('station-icon-active');
      const hoverIndex = expressionStr.indexOf('station-icon-hover');
      expect(activeIndex).toBeLessThan(hoverIndex);
    }
  });
});
