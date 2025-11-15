import { Router, Request, Response } from 'express';

import { pool } from '../config/database.js';
import { logger } from '../utils/logger.js';

const router = Router();

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  database: {
    connected: boolean;
    error?: string;
  };
}

/**
 * Health check endpoint
 * @route GET /health
 * @returns {HealthResponse} Service health status
 */
router.get('/health', (_req: Request, res: Response) => {
  void (async () => {
    const healthcheck: HealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: false,
      },
    };

    try {
      // Test database connection
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();

      healthcheck.database.connected = true;
    } catch (error) {
      logger.error('Health check failed - database error:', error);
      healthcheck.status = 'unhealthy';
      healthcheck.database.connected = false;
      healthcheck.database.error = error instanceof Error ? error.message : 'Unknown error';
    }

    const statusCode = healthcheck.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthcheck);
  })();
});

export default router;
