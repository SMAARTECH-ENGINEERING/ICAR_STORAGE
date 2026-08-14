const mongoose = require('mongoose');
const { DEVICE_STATUS } = require('../utils/constants');

const { Schema } = mongoose;

const deviceSchema = new Schema(
  {
    deviceId: { type: String, required: true, unique: true, index: true },
    roomId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    deviceType: { type: String, trim: true },
    firmwareVersion: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(DEVICE_STATUS),
      default: DEVICE_STATUS.UNKNOWN,
    },
    lastSeen: { type: Date },
  },
  { timestamps: true }
);

deviceSchema.index({ roomId: 1, deviceId: 1 });

module.exports = mongoose.model('Device', deviceSchema);
