import express, { Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import docsRouter from './routes/docs.js';
import healthRoutes from './routes/health/health.routes.js';
import stationsRoutes from './routes/stations/stations.routes.js';
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

  // API documentation
  app.use(`/api/${env.API_VERSION}`, docsRouter);

  // Routes
  app.use(`/api/${env.API_VERSION}`, healthRoutes);
  app.use(`/api/${env.API_VERSION}/stations`, stationsRoutes);

  // 404 handler - must be after all routes
  app.use(notFoundHandler);
  // Error handler - must be last
  app.use(errorHandler);

  logger.info('Express application configured successfully');

  return app;
}
