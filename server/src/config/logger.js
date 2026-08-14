const winston = require('winston');
const env = require('./env');

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'icar-storage-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length && meta.service
            ? ''
            : Object.keys(meta).length
              ? ` ${JSON.stringify(meta)}`
              : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      ),
    }),
  ],
});

module.exports = logger;
