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
    // Free-form: matches a Role document's `name` (see models/Role.js).
    // Roles are dynamic/DB-driven, not a fixed enum — ROLES.VIEWER below is
    // only the seeded default a fresh registration falls back to.
    role: {
      type: String,
      default: ROLES.VIEWER,
      trim: true,
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
