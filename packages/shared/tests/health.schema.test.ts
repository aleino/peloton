import { describe, it, expect } from 'vitest';
import { healthGetResponseBody } from '../src/schemas/health.schema.js';

describe('healthGetResponseBody', () => {
  it('validates correct health response', () => {
    const validData = {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: 12345,
    };

    const result = healthGetResponseBody.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('healthy');
      expect(result.data.database).toBe('connected');
      expect(result.data.uptime).toBe(12345);
    }
  });

  it('validates health response without optional uptime', () => {
    const validData = {
      status: 'degraded',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    };

    const result = healthGetResponseBody.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.uptime).toBeUndefined();
    }
  });

  it('rejects invalid status', () => {
    const invalidData = {
      status: 'invalid_status',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };

    const result = healthGetResponseBody.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects invalid database status', () => {
    const invalidData = {
      status: 'healthy',
      database: 'unknown',
      timestamp: new Date().toISOString(),
    };

    const result = healthGetResponseBody.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects invalid timestamp format', () => {
    const invalidData = {
      status: 'healthy',
      database: 'connected',
      timestamp: 'not-a-datetime',
    };

    const result = healthGetResponseBody.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const invalidData = {
      status: 'healthy',
    };

    const result = healthGetResponseBody.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('validates all status enum values', () => {
    const statuses: Array<'healthy' | 'degraded' | 'unhealthy'> = [
      'healthy',
      'degraded',
      'unhealthy',
    ];

    statuses.forEach((status) => {
      const data = {
        status,
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
      const result = healthGetResponseBody.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  it('validates all database enum values', () => {
    const databases: Array<'connected' | 'disconnected' | 'error'> = [
      'connected',
      'disconnected',
      'error',
    ];

    databases.forEach((database) => {
      const data = {
        status: 'healthy',
        database,
        timestamp: new Date().toISOString(),
      };
      const result = healthGetResponseBody.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
