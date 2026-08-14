const mongoose = require('mongoose');
const { ALERT_TYPE, ALERT_SEVERITY, ALERT_STATUS } = require('../utils/constants');

const { Schema } = mongoose;

const alertSchema = new Schema(
  {
    roomId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true, index: true },

    type: { type: String, enum: Object.values(ALERT_TYPE), required: true },
    parameter: { type: String },
    value: { type: Number },
    threshold: { type: Number },

    severity: {
      type: String,
      enum: Object.values(ALERT_SEVERITY),
      default: ALERT_SEVERITY.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(ALERT_STATUS),
      default: ALERT_STATUS.ACTIVE,
      index: true,
    },

    // Groups the physical condition this alert represents, used to prevent duplicate
    // active alerts for the same ongoing condition (e.g. deviceId:type:parameter).
    dedupeKey: { type: String, required: true, index: true },

    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

alertSchema.index({ roomId: 1, status: 1, createdAt: -1 });
alertSchema.index({ dedupeKey: 1, status: 1 });

module.exports = mongoose.model('Alert', alertSchema);
