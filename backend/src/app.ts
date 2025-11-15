import express, { Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/health.js';
import { logger, morganStream } from './utils/logger.js';


export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(corsMiddleware);

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // HTTP request logging
  const morganFormat = env.NODE_ENV === 'prod' ? 'combined' : 'dev';
  app.use(morgan(morganFormat, { stream: morganStream }));

  // Routes
  app.use('/health', healthRoutes);

  // 404 handler - must be after all routes
  app.use(notFoundHandler);
  // Error handler - must be last
  app.use(errorHandler);

  logger.info('Express application configured successfully');

  return app;
}
