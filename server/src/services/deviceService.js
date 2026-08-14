const Device = require('../models/Device');
const DeviceState = require('../models/DeviceState');
const Relay = require('../models/Relay');
const AutomationRule = require('../models/AutomationRule');
const RelayCommand = require('../models/RelayCommand');
const SensorReading = require('../models/SensorReading');
const ApiError = require('../utils/ApiError');
const { DEVICE_STATUS } = require('../utils/constants');
const roomService = require('./roomService');

async function createDevice(payload) {
  await roomService.assertRoomExists(payload.roomId);
  const device = await Device.create(payload);
  return device;
}

async function listDevices(filter = {}) {
  const query = {};
  if (filter.roomId) query.roomId = filter.roomId;
  if (filter.status) query.status = filter.status;
  return Device.find(query).sort({ createdAt: -1 });
}

async function getDeviceByDeviceId(deviceId) {
  const device = await Device.findOne({ deviceId });
  if (!device) {
    throw ApiError.notFound(`Device not found: ${deviceId}`, 'DEVICE_NOT_FOUND');
  }
  return device;
}

async function updateDevice(deviceId, updates) {
  if (updates.roomId) {
    await roomService.assertRoomExists(updates.roomId);
  }
  const device = await Device.findOneAndUpdate({ deviceId }, updates, {
    new: true,
    runValidators: true,
  });
  if (!device) {
    throw ApiError.notFound(`Device not found: ${deviceId}`, 'DEVICE_NOT_FOUND');
  }
  return device;
}

async function deleteDevice(deviceId) {
  const device = await Device.findOneAndDelete({ deviceId });
  if (!device) {
    throw ApiError.notFound(`Device not found: ${deviceId}`, 'DEVICE_NOT_FOUND');
  }
  await Promise.all([
    DeviceState.deleteOne({ deviceId }),
    Relay.deleteMany({ deviceId }),
    AutomationRule.deleteMany({ deviceId }),
    RelayCommand.deleteMany({ deviceId }),
    SensorReading.deleteMany({ deviceId }),
  ]);
  return device;
}

async function touchLastSeen(deviceId, timestamp = new Date()) {
  return Device.findOneAndUpdate(
    { deviceId },
    { lastSeen: timestamp, status: DEVICE_STATUS.ONLINE },
    { new: true }
  );
}

async function setStatus(deviceId, status) {
  return Device.findOneAndUpdate({ deviceId }, { status }, { new: true });
}

module.exports = {
  createDevice,
  listDevices,
  getDeviceByDeviceId,
  updateDevice,
  deleteDevice,
  touchLastSeen,
  setStatus,
};
