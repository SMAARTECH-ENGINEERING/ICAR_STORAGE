const mongoose = require('mongoose');
const { ROOM_STATUS } = require('../utils/constants');

const { Schema } = mongoose;

const roomSchema = new Schema(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    description: { type: String, trim: true },
    location: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(ROOM_STATUS),
      default: ROOM_STATUS.ACTIVE,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
