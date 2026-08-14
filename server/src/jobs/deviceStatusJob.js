const cron = require('node-cron');
const env = require('../config/env');
const logger = require('../config/logger');
const deviceStatusService = require('../services/deviceStatusService');

function start() {
  const intervalSeconds = env.DEVICE_STATUS_SWEEP_INTERVAL_SECONDS;
  const cronExpression = `*/${intervalSeconds} * * * * *`;

  const task = cron.schedule(cronExpression, async () => {
    try {
      const count = await deviceStatusService.sweepOfflineDevices();
      if (count > 0) {
        logger.info('Device status sweep marked %d device(s) offline', count);
      }
    } catch (err) {
      logger.error('Device status sweep failed: %s', err.message);
    }
  });

  logger.info('Device status sweep job scheduled every %d seconds', intervalSeconds);
  return task;
}

module.exports = { start };
