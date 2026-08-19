const mongoose = require('mongoose');

const { Schema } = mongoose;

const roleSchema = new Schema(
  {
    roleId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 300 },
    permissions: { type: [String], default: [] },
    // Seeded system roles (SUPER_ADMIN/ADMIN/VIEWER) can have their
    // permissions edited but never renamed or deleted, so the app can never
    // end up with zero usable roles.
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);
