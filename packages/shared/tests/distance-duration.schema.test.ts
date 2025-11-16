import { describe, it, expect } from 'vitest';
import { distance, duration, createDistance, createDuration } from '../src/schemas/common.schema.js';

describe('Distance Schema', () => {
  describe('Rounding Behavior', () => {
    it('should round to nearest integer', () => {
      expect(distance.parse(1234.56)).toBe(1235);
      expect(distance.parse(1234.49)).toBe(1234);
      expect(distance.parse(1234.5)).toBe(1235);
    });

    it('should handle whole numbers', () => {
      expect(distance.parse(1234)).toBe(1234);
      expect(distance.parse(0)).toBe(0);
      expect(distance.parse(5000)).toBe(5000);
    });

    it('should round very small decimals', () => {
      expect(distance.parse(0.1)).toBe(0);
      expect(distance.parse(0.5)).toBe(1);
      expect(distance.parse(0.6)).toBe(1);
      expect(distance.parse(1.1)).toBe(1);
      expect(distance.parse(1.9)).toBe(2);
    });
  });

  describe('Validation', () => {
    it('should accept zero', () => {
      expect(distance.parse(0)).toBe(0);
    });

    it('should reject negative numbers', () => {
      expect(() => distance.parse(-1)).toThrow('Distance must be non-negative');
      expect(() => distance.parse(-100.5)).toThrow('Distance must be non-negative');
    });

    it('should accept very large numbers', () => {
      expect(distance.parse(999999.99)).toBe(1000000);
      expect(distance.parse(1000000)).toBe(1000000);
    });
  });

  describe('Helper Function', () => {
    it('should work with createDistance helper', () => {
      expect(createDistance(1234.56)).toBe(1235);
      expect(createDistance(0)).toBe(0);
      expect(createDistance(999.4)).toBe(999);
    });

    it('should throw on invalid input', () => {
      expect(() => createDistance(-100)).toThrow();
    });
  });
});

describe('Duration Schema', () => {
  describe('Rounding Behavior', () => {
    it('should round to nearest integer', () => {
      expect(duration.parse(180.6)).toBe(181);
      expect(duration.parse(180.4)).toBe(180);
      expect(duration.parse(180.5)).toBe(181);
    });

    it('should handle whole numbers', () => {
      expect(duration.parse(180)).toBe(180);
      expect(duration.parse(0)).toBe(0);
      expect(duration.parse(3600)).toBe(3600);
    });

    it('should round very small decimals', () => {
      expect(duration.parse(0.1)).toBe(0);
      expect(duration.parse(0.5)).toBe(1);
      expect(duration.parse(0.6)).toBe(1);
      expect(duration.parse(1.1)).toBe(1);
      expect(duration.parse(1.9)).toBe(2);
    });
  });

  describe('Validation', () => {
    it('should accept zero', () => {
      expect(duration.parse(0)).toBe(0);
    });

    it('should reject negative numbers', () => {
      expect(() => duration.parse(-1)).toThrow('Duration must be non-negative');
      expect(() => duration.parse(-180.5)).toThrow('Duration must be non-negative');
    });

    it('should accept very large numbers', () => {
      expect(duration.parse(999999.99)).toBe(1000000);
      expect(duration.parse(86400)).toBe(86400); // 24 hours in seconds
    });
  });

  describe('Helper Function', () => {
    it('should work with createDuration helper', () => {
      expect(createDuration(180.6)).toBe(181);
      expect(createDuration(0)).toBe(0);
      expect(createDuration(59.4)).toBe(59);
    });

    it('should throw on invalid input', () => {
      expect(() => createDuration(-100)).toThrow();
    });
  });
});

describe('Edge Cases', () => {
  it('should handle infinity (rounds to Infinity)', () => {
    // Note: Zod doesn't reject Infinity by default, it gets rounded
    expect(distance.parse(Infinity)).toBe(Infinity);
    expect(duration.parse(Infinity)).toBe(Infinity);
  });

  it('should handle NaN', () => {
    expect(() => distance.parse(NaN)).toThrow();
    expect(() => duration.parse(NaN)).toThrow();
  });

  it('should handle string numbers (schema should reject)', () => {
    expect(() => distance.parse('1234' as any)).toThrow();
    expect(() => duration.parse('180' as any)).toThrow();
  });
});

describe('Real-world Scenarios', () => {
  it('should handle typical bike trip distances', () => {
    expect(distance.parse(1234.567)).toBe(1235); // 1.2km trip
    expect(distance.parse(5432.1)).toBe(5432);   // 5.4km trip
    expect(distance.parse(250.9)).toBe(251);     // Short trip
  });

  it('should handle typical bike trip durations', () => {
    expect(duration.parse(895.3)).toBe(895);    // ~15 minutes
    expect(duration.parse(1800.7)).toBe(1801);  // ~30 minutes
    expect(duration.parse(3600.2)).toBe(3600);  // 1 hour
  });

  it('should handle SQL AVG() results', () => {
    // SQL AVG() often returns values like 1234.5678901234
    expect(distance.parse(1234.5678901234)).toBe(1235);
    expect(duration.parse(895.3333333333)).toBe(895);
  });
});
