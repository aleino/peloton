import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

// Extend Zod with OpenAPI capabilities
extendZodWithOpenApi(z);

/**
 * Health check response (GET /api/v1/health)
 */
export const healthGetResponseBody = z
  .object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']).openapi({
      description: 'Overall system health status',
      example: 'healthy',
    }),
    database: z.enum(['connected', 'disconnected', 'error']).openapi({
      description: 'Database connectivity status',
      example: 'connected',
    }),
    timestamp: z.string().datetime().openapi({
      description: 'Current server timestamp (ISO 8601)',
      example: '2025-11-15T02:33:00.000Z',
    }),
    uptime: z.number().int().positive().optional().openapi({
      description: 'Server uptime in seconds',
      example: 3456,
    }),
  })
  .openapi('HealthGetResponseBody');

export type HealthGetResponseBody = z.infer<typeof healthGetResponseBody>;