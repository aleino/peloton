import { createApp } from './app.js';
import { closeDatabasePool, testConnection } from './config/database.js';
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
      logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
      logger.info(`📊 Health check: http://localhost:${env.PORT}/api/${env.API_VERSION}/health`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await closeDatabasePool();
          logger.info('Database connections closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

void startServer();
