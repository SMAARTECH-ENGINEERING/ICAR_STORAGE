const mongoose = require('mongoose');
const { RELAY_MODE, RELAY_STATE } = require('../utils/constants');

const { Schema } = mongoose;

const relaySchema = new Schema(
  {
    deviceId: { type: String, required: true, index: true },
    relayId: { type: String, required: true },
    name: { type: String, trim: true },

    mode: {
      type: String,
      enum: Object.values(RELAY_MODE),
      default: RELAY_MODE.MANUAL,
    },
    state: {
      type: String,
      enum: Object.values(RELAY_STATE),
      default: RELAY_STATE.OFF,
    },

    controlSource: { type: String, trim: true },
    controllingZone: { type: String, trim: true },

    thresholdOnC: { type: Number },
    thresholdOffC: { type: Number },
  },
  { timestamps: true }
);

relaySchema.index({ deviceId: 1, relayId: 1 }, { unique: true });

module.exports = mongoose.model('Relay', relaySchema);
