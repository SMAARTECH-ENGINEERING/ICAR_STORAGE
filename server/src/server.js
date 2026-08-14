const http = require('http');
const env = require('./config/env');
const logger = require('./config/logger');
const connectDB = require('./config/db');
const app = require('./app');
const socketService = require('./sockets');
const deviceStatusJob = require('./jobs/deviceStatusJob');
const retentionJob = require('./jobs/retentionJob');

async function start() {
  await connectDB();

  const httpServer = http.createServer(app);

  socketService.init(httpServer);

  deviceStatusJob.start();
  retentionJob.start();

  httpServer.listen(env.PORT, () => {
    logger.info('ICAR Storage backend listening on port %d (%s)', env.PORT, env.NODE_ENV);
  });

  const shutdown = (signal) => {
    logger.info('Received %s, shutting down gracefully...', signal);
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection: %s', reason instanceof Error ? reason.stack : reason);
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception: %s', err.stack);
    process.exit(1);
  });
}

start().catch((err) => {
  logger.error('Failed to start server: %s', err.stack || err.message);
  process.exit(1);
});
