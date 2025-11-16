import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

// Extend Zod with OpenAPI capabilities
extendZodWithOpenApi(z);

/**
 * Standard error response
 */
export const errorResponseBody = z
  .object({
    code: z.string().openapi({
      description: 'Error code',
      example: 'VALIDATION_ERROR',
    }),
    message: z.string().openapi({
      description: 'Human-readable error message',
      example: 'Invalid request parameters',
    }),
    details: z.record(z.unknown()).optional().openapi({
      description: 'Additional error details',
      example: { field: 'email', issue: 'Invalid format' },
    }),
  })
  .openapi('ErrorResponseBody');

export type ErrorResponseBody = z.infer<typeof errorResponseBody>;

/**
 * Distance in meters, rounded to nearest integer.
 *
 * @example 1234 // Valid
 * @example 1234.56 // Will be rounded to 1235
 */
export const distance = z
  .number()
  .nonnegative('Distance must be non-negative')
  .transform((val) => Math.round(val))
  .openapi({
    description: 'Distance in meters (integer)',
    example: 1234,
  });

export type Distance = z.infer<typeof distance>;

/**
 * Duration in seconds, rounded to nearest integer.
 *
 * @example 180 // Valid
 * @example 180.5 // Will be rounded to 181
 */
export const duration = z
  .number()
  .nonnegative('Duration must be non-negative')
  .transform((val) => Math.round(val))
  .openapi({
    description: 'Duration in seconds (integer)',
    example: 180,
  });

export type Duration = z.infer<typeof duration>;

/**
 * Helper to create a Distance value with proper rounding.
 * Useful when you need to create distance values programmatically.
 */
export function createDistance(value: number): Distance {
  return distance.parse(value);
}

/**
 * Helper to create a Duration value with proper rounding.
 * Useful when you need to create duration values programmatically.
 */
export function createDuration(value: number): Duration {
  return duration.parse(value);
}
