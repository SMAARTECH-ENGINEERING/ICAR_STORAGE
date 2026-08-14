const mongoose = require("mongoose");

const { Schema } = mongoose;

const deviceStateSchema = new Schema(
  {
    roomId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true, unique: true, index: true },

    sensors: { type: Schema.Types.Mixed, default: {} },
    relays: { type: Schema.Types.Mixed, default: {} },

    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("DeviceState", deviceStateSchema);
