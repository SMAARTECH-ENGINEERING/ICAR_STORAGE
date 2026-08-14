const mongoose = require("mongoose");
const {
  RELAY_STATE,
  COMMAND_STATUS,
  COMMAND_SOURCE,
} = require("../utils/constants");

const { Schema } = mongoose;

const relayCommandSchema = new Schema(
  {
    commandId: { type: String, required: true, unique: true, index: true },
    roomId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true, index: true },
    relayId: { type: String, required: true },

    requestedState: {
      type: String,
      enum: Object.values(RELAY_STATE),
      required: true,
    },
    previousState: { type: String, enum: Object.values(RELAY_STATE) },

    source: {
      type: String,
      enum: Object.values(COMMAND_SOURCE),
      required: true,
    },
    requestedBy: { type: String },

    status: {
      type: String,
      enum: Object.values(COMMAND_STATUS),
      default: COMMAND_STATUS.PENDING,
      index: true,
    },

    sentAt: { type: Date },
    acknowledgedAt: { type: Date },
    completedAt: { type: Date },

    error: { type: String },
  },
  { timestamps: true },
);

relayCommandSchema.index({ deviceId: 1, relayId: 1, createdAt: -1 });

module.exports = mongoose.model("RelayCommand", relayCommandSchema);
