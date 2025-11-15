import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { healthGetResponseBody, type HealthGetResponseBody } from '@peloton/shared';

import { checkDatabaseHealth } from '../config/database.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/v1/health
 *
 * Health check endpoint for monitoring and load balancers
 *
 * @returns 200 OK if healthy, 503 Service Unavailable if degraded
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    const dbHealth = await checkDatabaseHealth();
    const uptime = Math.floor(process.uptime());
    const status = dbHealth.connected ? 'healthy' : 'degraded';
    const httpStatus = dbHealth.connected ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE;

    const response: HealthGetResponseBody = {
      status,
      database: dbHealth.connected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      uptime,
    };

    // Validate response against schema
    const validated = healthGetResponseBody.parse(response);

    const responseTime = Date.now() - startTime;
    logger.debug(`Health check completed in ${responseTime}ms - status: ${status}`);

    res.status(httpStatus).json(validated);
  } catch (error) {
    logger.error('Health check error:', error);

    // Return error response on unexpected errors
    res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      code: 'HEALTH_CHECK_FAILED',
      message: 'Health check encountered an error',
      details: error instanceof Error ? { message: error.message } : {},
    });
  }
});

export default router;
