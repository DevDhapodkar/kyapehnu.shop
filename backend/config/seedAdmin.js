import Admin from '../models/Admin.js';
import { hashPassword } from '../utils/adminAuth.js';

/**
 * Idempotently create the bootstrap admin from env on boot, so a fresh deploy
 * has a way in without a manual DB write. Set ADMIN_EMAIL + ADMIN_PASSWORD in
 * the environment; the account is created once and then left untouched (change
 * the password later through the app, not by editing env).
 *
 * Safe to call on every boot: it no-ops when the vars are unset or the admin
 * already exists, and never throws into the boot path.
 */
export const ensureAdminSeed = async () => {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) return;

  try {
    const existing = await Admin.findOne({ email });
    if (existing) return;

    await Admin.create({
      email,
      passwordHash: await hashPassword(password),
      name: process.env.ADMIN_NAME || 'Admin',
      role: 'SUPER_ADMIN',
    });
    console.log(`Bootstrap admin created: ${email}`);
  } catch (error) {
    console.error(`Admin bootstrap skipped: ${error.message}`);
  }
};
