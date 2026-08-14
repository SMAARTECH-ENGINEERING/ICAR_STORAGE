const cron = require('node-cron');
const env = require('../config/env');
const logger = require('../config/logger');
const SensorReading = require('../models/SensorReading');

async function cleanupOldReadings() {
  const cutoff = new Date(Date.now() - env.SENSOR_DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const result = await SensorReading.deleteMany({ timestamp: { $lt: cutoff } });
  if (result.deletedCount > 0) {
    logger.info(
      'Retention cleanup removed %d sensor reading(s) older than %d days',
      result.deletedCount,
      env.SENSOR_DATA_RETENTION_DAYS
    );
  }
  return result.deletedCount;
}

function start() {
  const task = cron.schedule(env.RETENTION_CLEANUP_CRON, async () => {
    try {
      await cleanupOldReadings();
    } catch (err) {
      logger.error('Retention cleanup failed: %s', err.message);
    }
  });

  logger.info('Sensor data retention cleanup job scheduled with cron "%s"', env.RETENTION_CLEANUP_CRON);
  return task;
}

module.exports = { start, cleanupOldReadings };
