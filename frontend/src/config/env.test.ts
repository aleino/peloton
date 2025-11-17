import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Environment Configuration', () => {
  it('should validate correct environment variables', () => {
    const schema = z.object({
      VITE_API_BASE_URL: z.string().url(),
      VITE_MAPBOX_TOKEN: z.string().startsWith('pk.'),
      VITE_DEFAULT_LOCALE: z.enum(['en', 'fi']),
    });

    const result = schema.safeParse({
      VITE_API_BASE_URL: 'http://localhost:3000/api/v1',
      VITE_MAPBOX_TOKEN: 'pk.test_token',
      VITE_DEFAULT_LOCALE: 'en',
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid API URL', () => {
    const schema = z.object({
      VITE_API_BASE_URL: z.string().url(),
    });

    const result = schema.safeParse({
      VITE_API_BASE_URL: 'not-a-url',
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid Mapbox token', () => {
    const schema = z.object({
      VITE_MAPBOX_TOKEN: z.string().startsWith('pk.'),
    });

    const result = schema.safeParse({
      VITE_MAPBOX_TOKEN: 'invalid_token',
    });

    expect(result.success).toBe(false);
  });

  it('should validate locale enum', () => {
    const schema = z.object({
      VITE_DEFAULT_LOCALE: z.enum(['en', 'fi']),
    });

    const validResult = schema.safeParse({
      VITE_DEFAULT_LOCALE: 'en',
    });
    expect(validResult.success).toBe(true);

    const invalidResult = schema.safeParse({
      VITE_DEFAULT_LOCALE: 'de',
    });
    expect(invalidResult.success).toBe(false);
  });

  it('should transform boolean flags from strings', () => {
    const schema = z.object({
      VITE_ENABLE_DEBUG_MODE: z
        .string()
        .default('false')
        .transform((val) => val === 'true')
        .pipe(z.boolean()),
    });

    const trueResult = schema.safeParse({
      VITE_ENABLE_DEBUG_MODE: 'true',
    });
    expect(trueResult.success).toBe(true);
    if (trueResult.success) {
      expect(trueResult.data.VITE_ENABLE_DEBUG_MODE).toBe(true);
    }

    const falseResult = schema.safeParse({
      VITE_ENABLE_DEBUG_MODE: 'false',
    });
    expect(falseResult.success).toBe(true);
    if (falseResult.success) {
      expect(falseResult.data.VITE_ENABLE_DEBUG_MODE).toBe(false);
    }
  });
});
