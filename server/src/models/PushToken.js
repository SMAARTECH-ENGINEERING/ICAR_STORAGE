const mongoose = require('mongoose');

const { Schema } = mongoose;

const pushTokenSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    platform: { type: String, enum: ['ios', 'android'], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PushToken', pushTokenSchema);
