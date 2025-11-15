import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { healthGetResponseBody } from '@peloton/shared';

export function registerHealthEndpoints(registry: OpenAPIRegistry) {
  registry.registerPath({
    method: 'get',
    path: '/health',
    tags: ['Health'],
    summary: 'Health check endpoint',
    description: `
Check the health status of the API server and database connectivity.

This endpoint is used by:
- Docker health checks
- Load balancer health probes  
- Monitoring systems
- CI/CD deployment validation
    `.trim(),
    responses: {
      200: {
        description: 'System is healthy',
        content: {
          'application/json': {
            schema: healthGetResponseBody,
            examples: {
              healthy: {
                summary: 'Healthy system',
                value: {
                  status: 'healthy',
                  database: 'connected',
                  timestamp: '2025-11-15T02:33:00.000Z',
                  uptime: 3456,
                },
              },
            },
          },
        },
      },
      503: {
        description: 'Service unavailable (database disconnected)',
        content: {
          'application/json': {
            schema: healthGetResponseBody,
            examples: {
              degraded: {
                summary: 'Degraded system',
                value: {
                  status: 'degraded',
                  database: 'disconnected',
                  timestamp: '2025-11-15T02:33:00.000Z',
                  uptime: 3456,
                },
              },
            },
          },
        },
      },
    },
  });
}
