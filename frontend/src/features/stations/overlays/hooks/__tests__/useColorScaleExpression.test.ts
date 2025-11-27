import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useColorScaleExpression } from '../useColorScaleExpression';
import { ExpressionSpecification } from 'mapbox-gl';

describe('useColorScaleExpression', () => {
  const defaultOptions = {
    minValue: 0,
    maxValue: 100,
    scaleType: 'linear' as const,
    inputValue: ['get', 'count'] as ExpressionSpecification,
  };

  it('should return fallback color when min equals max', () => {
    const { result } = renderHook(() =>
      useColorScaleExpression({
        ...defaultOptions,
        minValue: 10,
        maxValue: 10,
      })
    );

    expect(result.current).toBe('#cccccc');
  });

  it('should return linear expression', () => {
    const { result } = renderHook(() =>
      useColorScaleExpression({
        ...defaultOptions,
        scaleType: 'linear',
      })
    );

    expect(result.current).toEqual(expect.arrayContaining(['interpolate', ['linear']]));
  });

  it('should return log expression', () => {
    const { result } = renderHook(() =>
      useColorScaleExpression({
        ...defaultOptions,
        scaleType: 'log',
        minValue: 1, // Log scale needs > 0
      })
    );

    expect(result.current).toEqual(expect.arrayContaining(['interpolate', ['linear']]));
  });

  it('should return quantile expression', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const { result } = renderHook(() =>
      useColorScaleExpression({
        ...defaultOptions,
        scaleType: 'quantile',
        values,
      })
    );

    expect(result.current).toEqual(expect.arrayContaining(['step']));
  });

  it('should return fallback for quantile without values', () => {
    const { result } = renderHook(() =>
      useColorScaleExpression({
        ...defaultOptions,
        scaleType: 'quantile',
        // values missing
      })
    );

    expect(result.current).toBe('#cccccc');
  });

  it('should return diverging expression', () => {
    const values = [-10, -5, 0, 5, 10];
    const { result } = renderHook(() =>
      useColorScaleExpression({
        ...defaultOptions,
        isDiverging: true,
        values,
      })
    );

    expect(result.current).toEqual(expect.arrayContaining(['interpolate', ['linear']]));
  });

  it('should return fallback for diverging without values', () => {
    const { result } = renderHook(() =>
      useColorScaleExpression({
        ...defaultOptions,
        isDiverging: true,
        // values missing
      })
    );

    expect(result.current).toBe('#cccccc');
  });
});
