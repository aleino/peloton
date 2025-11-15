import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { env } from './env.js';
import { healthGetResponseBody } from '@peloton/shared';

/**
 * OpenAPI Registry - central place to register all schemas and routes
 */
export const registry = new OpenAPIRegistry();

// Register health endpoint
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

/**
 * Generate OpenAPI document from registry
 */
export function getOpenAPIDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Peloton HSL API',
      version: '1.0.0',
      description: `
HSL City Bike Trip Visualization API

This API provides access to Helsinki Region Transport (HSL) bike trip data,
including station locations, trip statistics, and route analytics.

**Current Version**: MVP - Health Check Only
            `.trim(),
      contact: {
        name: 'Peloton Development Team',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/${env.API_VERSION}`,
        description: 'Local development server',
      },
      {
        url: `http://localhost:${env.PORT}/api/${env.API_VERSION}`,
        description: 'Docker development environment',
      },
    ],
    tags: [{ name: 'Health', description: 'System health and monitoring endpoints' }],
  });
}
