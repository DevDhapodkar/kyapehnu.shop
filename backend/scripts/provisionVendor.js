/**
 * Admin vendor provisioning (CLI).
 *
 * The command-line twin of the admin panel's approve action: it promotes an
 * account to VENDOR and optionally seeds the shop document, using the exact same
 * provisioning service so both paths behave identically.
 *
 *   1. Firestore users/{uid}.role = 'VENDOR'  → gates the app into the desk.
 *   2. MongoDB Vendor document                → the shop profile.
 *
 * Usage:
 *   node scripts/provisionVendor.js --email shop@example.com --profile ./scripts/vendor.example.json
 *   node scripts/provisionVendor.js --email shop@example.com          # role only
 *   node scripts/provisionVendor.js --email shop@example.com --demote # back to CUSTOMER
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

import { firebaseAuth } from '../config/firebase.js';
import connectDB from '../config/db.js';
import { approveVendor, revokeVendor, setUserRole, ROLES } from '../services/vendorProvisioning.js';

/** Minimal `--flag value` / `--flag` parser — no dependency needed. */
const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
};

const die = (message) => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  if (!args.email) {
    die('Missing --email. Usage: node scripts/provisionVendor.js --email shop@example.com [--profile ./scripts/vendor.example.json] [--demote]');
  }

  const demote = Boolean(args.demote);

  // Resolve the Firebase account by email.
  let user;
  try {
    user = await firebaseAuth.getUserByEmail(args.email);
  } catch (error) {
    die(`No Firebase user for ${args.email} (${error.code || error.message}). They must sign up in the app first.`);
  }

  if (demote) {
    await connectDB();
    await revokeVendor({ uid: user.uid, email: user.email });
    console.log(`✓ ${user.email} demoted to ${ROLES.CUSTOMER} (shop deactivated if present)`);
    await mongoose.connection.close();
    process.exit(0);
  }

  if (args.profile) {
    const profilePath = path.resolve(String(args.profile));
    if (!fs.existsSync(profilePath)) die(`Profile file not found: ${profilePath}`);

    let profile;
    try {
      profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
    } catch (error) {
      die(`Could not parse ${profilePath}: ${error.message}`);
    }

    await connectDB();
    const vendor = await approveVendor({ uid: user.uid, email: user.email, profile });
    console.log(`✓ ${user.email} → ${ROLES.VENDOR}; shop "${vendor.shopName}" (${vendor._id})`);
    await mongoose.connection.close();
    process.exit(0);
  }

  // Role only — no shop document yet.
  await setUserRole(user.uid, user.email, ROLES.VENDOR);
  console.log(`✓ Firestore role for ${user.email} → ${ROLES.VENDOR}`);
  console.log('ℹ No --profile given: create the shop record via the admin panel/approve,');
  console.log('  POST /api/vendors/sync, or re-run with --profile ./scripts/vendor.example.json');
  process.exit(0);
};

main().catch((error) => {
  console.error('✗ Provisioning failed:', error);
  process.exit(1);
});
