const mongoose = require('mongoose');

const { Schema } = mongoose;

const sensorReadingSchema = new Schema(
  {
    roomId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },

    // Sensor zones are dynamic (device-defined keys like upper/middle/lower/co2/etc.)
    sensors: { type: Schema.Types.Mixed, default: {} },

    // Relay snapshot at the time of this reading, keyed by relayId
    relays: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

sensorReadingSchema.index({ roomId: 1, timestamp: -1 });
sensorReadingSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
