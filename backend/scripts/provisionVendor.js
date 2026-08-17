/**
 * Admin vendor provisioning.
 *
 * A vendor account is two linked records, neither of which a client can create
 * for itself (by design — the app is admin-approved, not self-serve):
 *
 *   1. Firestore  users/{uid}.role = 'VENDOR'   → gates the app into the order
 *      desk. The client reads this; Security Rules forbid self-promotion, so it
 *      must be written with the Admin SDK (which bypasses rules).
 *   2. MongoDB    Vendor document                → the shop profile the vendor
 *      endpoints (`/api/vendors/me`, orders, catalog) resolve by firebaseUid.
 *
 * This script does both atomically-ish: it flips the role, and if a profile
 * JSON is supplied, upserts the Vendor document too.
 *
 * Usage:
 *   node scripts/provisionVendor.js --email shop@example.com --profile ./vendor.json
 *   node scripts/provisionVendor.js --email shop@example.com          # role only
 *   node scripts/provisionVendor.js --email shop@example.com --demote # back to CUSTOMER
 *
 * A vendor.json template lives beside this file (vendor.example.json).
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

import { firebaseAuth, firestore } from '../config/firebase.js';
import connectDB from '../config/db.js';
import Vendor from '../models/Vendor.js';
import mongoose from 'mongoose';

const ROLES = { CUSTOMER: 'CUSTOMER', VENDOR: 'VENDOR' };

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

const setFirestoreRole = async (uid, email, role) => {
  await firestore
    .collection('users')
    .doc(uid)
    .set({ uid, email, role }, { merge: true });
};

const upsertVendorDoc = async (uid, email, profile) => {
  return Vendor.findOneAndUpdate(
    { firebaseUid: uid },
    { firebaseUid: uid, email, ...profile },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  if (!args.email) {
    die('Missing --email. Usage: node scripts/provisionVendor.js --email shop@example.com [--profile ./vendor.json] [--demote]');
  }

  const demote = Boolean(args.demote);
  const targetRole = demote ? ROLES.CUSTOMER : ROLES.VENDOR;

  // 1) Resolve the Firebase account by email.
  let user;
  try {
    user = await firebaseAuth.getUserByEmail(args.email);
  } catch (error) {
    die(`No Firebase user for ${args.email} (${error.code || error.message}). They must sign up in the app first.`);
  }

  // 2) Flip the role in Firestore (what the app actually reads).
  await setFirestoreRole(user.uid, user.email, targetRole);
  console.log(`✓ Firestore role for ${user.email} → ${targetRole}`);

  // 3) Optionally seed/refresh the MongoDB Vendor document.
  if (!demote && args.profile) {
    const profilePath = path.resolve(String(args.profile));
    if (!fs.existsSync(profilePath)) die(`Profile file not found: ${profilePath}`);

    let profile;
    try {
      profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
    } catch (error) {
      die(`Could not parse ${profilePath}: ${error.message}`);
    }

    await connectDB();
    const vendor = await upsertVendorDoc(user.uid, user.email, profile);
    console.log(`✓ Vendor document upserted: "${vendor.shopName}" (${vendor._id})`);
    await mongoose.connection.close();
  } else if (!demote) {
    console.log('ℹ No --profile given: role set, but create the shop record via');
    console.log('  POST /api/vendors/sync (as the vendor) or re-run with --profile ./vendor.json');
  }

  console.log('Done.');
  process.exit(0);
};

main().catch((error) => {
  console.error('✗ Provisioning failed:', error);
  process.exit(1);
});
