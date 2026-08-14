const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ROLES } = require("../utils/constants");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.VIEWER,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
};

module.exports = mongoose.model("User", userSchema);
