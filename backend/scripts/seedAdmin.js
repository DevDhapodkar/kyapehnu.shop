/**
 * Seed (or reset the password of) a platform admin account.
 *
 *   ADMIN_EMAIL=ops@kyapehnu.shop ADMIN_PASSWORD='strong-pass' \
 *   ADMIN_NAME='Ops' ADMIN_ROLE=SUPER_ADMIN npm run seed:admin
 *
 * Idempotent: re-running updates the existing admin's password/name/role.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

import connectDB from '../config/db.js';
import Admin from '../models/Admin.js';

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Admin', ADMIN_ROLE = 'SUPER_ADMIN' } = process.env;

const run = async () => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars.');
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 10) {
    console.error('ADMIN_PASSWORD must be at least 10 characters.');
    process.exit(1);
  }

  await connectDB();
  const passwordHash = await Admin.hashPassword(ADMIN_PASSWORD);
  const admin = await Admin.findOneAndUpdate(
    { email: ADMIN_EMAIL.toLowerCase().trim() },
    { email: ADMIN_EMAIL.toLowerCase().trim(), name: ADMIN_NAME, role: ADMIN_ROLE, passwordHash, isActive: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Admin ready: ${admin.email} (${admin.role})`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
