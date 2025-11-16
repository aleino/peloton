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
