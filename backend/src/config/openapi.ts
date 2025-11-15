import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { env } from './env.js';
import { registerHealthEndpoints } from '../routes/health/health.openapi.js';


export const registry = new OpenAPIRegistry();

// Register all endpoint groups
registerHealthEndpoints(registry);

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
