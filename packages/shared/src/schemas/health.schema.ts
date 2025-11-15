import { z } from 'zod';

/**
 * Health check response (GET /api/v1/health)
 */
export const healthGetResponseBody = z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    database: z.enum(['connected', 'disconnected', 'error']),
    timestamp: z.string().datetime(),
    uptime: z.number().optional(),
});

export type HealthGetResponseBody = z.infer<typeof healthGetResponseBody>;
