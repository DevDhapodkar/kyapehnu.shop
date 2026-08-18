import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Platform staff account for the admin portal. Kept separate from Firebase-auth
 * customers/vendors: admin auth is an email + bcrypt password + JWT session
 * cookie, so the internal back-office does not depend on the mobile Firebase
 * project and can be locked down independently.
 */
const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'OPS', 'SUPPORT'],
      default: 'OPS',
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

adminSchema.methods.verifyPassword = function verifyPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

adminSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
};

/** Never serialise the hash. */
adminSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

export default mongoose.model('Admin', adminSchema);
