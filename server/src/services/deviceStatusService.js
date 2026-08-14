const Device = require('../models/Device');
const env = require('../config/env');
const { DEVICE_STATUS } = require('../utils/constants');
const socketService = require('../sockets');
const alertService = require('./alertService');
const logger = require('../config/logger');

async function sweepOfflineDevices() {
  const cutoff = new Date(Date.now() - env.DEVICE_OFFLINE_TIMEOUT_SECONDS * 1000);

  const staleDevices = await Device.find({
    status: DEVICE_STATUS.ONLINE,
    lastSeen: { $lt: cutoff },
  });

  for (const device of staleDevices) {
    device.status = DEVICE_STATUS.OFFLINE;
    await device.save();

    socketService.emitToRoomAndDevice(device.roomId, device.deviceId, 'device:offline', {
      deviceId: device.deviceId,
      roomId: device.roomId,
      lastSeen: device.lastSeen,
    });

    await alertService.raiseDeviceOfflineAlert(device.roomId, device.deviceId);
    logger.info('Device %s marked OFFLINE (last seen %s)', device.deviceId, device.lastSeen);
  }

  return staleDevices.length;
}

module.exports = { sweepOfflineDevices };
