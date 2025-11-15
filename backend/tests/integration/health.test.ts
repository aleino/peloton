import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { createApp } from '../../src/app.js';
import { closeDatabasePool } from '../../src/config/database.js';

describe('GET /api/v1/health', () => {
  const app = createApp();

  afterAll(async () => {
    await closeDatabasePool();
  });

  it('should return 200 and health data', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body.database).toBe('connected');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should complete quickly', async () => {
    const start = Date.now();
    await request(app).get('/api/v1/health');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500);
  });

  it('should return valid ISO 8601 timestamp', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    const timestamp = new Date(response.body.timestamp);
    expect(timestamp.toISOString()).toBe(response.body.timestamp);
  });

  it('should return uptime as integer', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(Number.isInteger(response.body.uptime)).toBe(true);
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should have correct response structure', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('database');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });
});
