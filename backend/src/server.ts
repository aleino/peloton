import { createApp } from './app.js';
import { testConnection } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';


async function startServer(): Promise<void> {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.warn('Server starting without database connection');
    }

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`API Version: ${env.API_VERSION}`);
    });

    // Graceful shutdown
    const shutdown = () => {
      logger.info('Received shutdown signal, closing server...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

void startServer();
