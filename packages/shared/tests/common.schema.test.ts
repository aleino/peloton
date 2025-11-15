import { describe, it, expect } from 'vitest';
import { errorResponseBody } from '../src/schemas/common.schema.js';

describe('errorResponseBody', () => {
  it('validates correct error response', () => {
    const validData = {
      code: 'DATABASE_ERROR',
      message: 'Failed to connect to database',
      details: {
        host: 'localhost',
        port: 5432,
      },
    };

    const result = errorResponseBody.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe('DATABASE_ERROR');
      expect(result.data.message).toBe('Failed to connect to database');
      expect(result.data.details).toEqual({
        host: 'localhost',
        port: 5432,
      });
    }
  });

  it('validates error response without optional details', () => {
    const validData = {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    };

    const result = errorResponseBody.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.details).toBeUndefined();
    }
  });

  it('rejects missing required fields', () => {
    const invalidData = {
      code: 'ERROR_CODE',
    };

    const result = errorResponseBody.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('accepts empty details object', () => {
    const validData = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: {},
    };

    const result = errorResponseBody.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts complex nested details', () => {
    const validData = {
      code: 'VALIDATION_ERROR',
      message: 'Multiple validation errors',
      details: {
        fields: {
          email: ['Invalid email format', 'Email already exists'],
          password: ['Password too short'],
        },
        count: 3,
      },
    };

    const result = errorResponseBody.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects non-string code', () => {
    const invalidData = {
      code: 404,
      message: 'Not found',
    };

    const result = errorResponseBody.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects non-string message', () => {
    const invalidData = {
      code: 'ERROR',
      message: 12345,
    };

    const result = errorResponseBody.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
