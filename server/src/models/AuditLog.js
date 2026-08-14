const mongoose = require('mongoose');

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    userId: { type: String, index: true },
    action: { type: String, required: true, index: true },
    roomId: { type: String },
    deviceId: { type: String },
    relayId: { type: String },
    previousValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
