import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';

const port = config.port;

logger.info(`🚀 Starting AI Support Hub server...`);
logger.info(`📍 Environment: ${config.isDevelopment ? 'development' : 'production'}`);
logger.info(`🌐 Server URL: ${config.appUrl}`);

const server = Bun.serve({
  fetch: app.fetch,
  port,
});

logger.info(`✅ Server running on port ${port}`);
logger.info(`📝 API Documentation: ${config.appUrl}/health`);

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('⏳ Shutting down gracefully...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('⏳ Shutting down gracefully...');
  server.stop();
  process.exit(0);
});