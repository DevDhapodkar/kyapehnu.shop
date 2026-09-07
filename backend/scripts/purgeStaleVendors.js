import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Vendor from '../models/Vendor.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

dotenv.config();

/**
 * One-off remediation script for the Kya Pehnu production database.
 *
 * Two jobs:
 *   1. Delete the stale seed/leaked vendor record(s) — the "Studio Saanjh
 *      Couture / Meera Kulkarni" identity that surfaced under other users'
 *      accounts on the pre-fix deploy — and any products attached to them.
 *   2. Report (never auto-delete) vendor documents that look cross-bound: a
 *      vendor whose firebaseUid also owns a customer User account with a
 *      DIFFERENT email. Those are the fingerprints of the old
 *      {firebaseUid OR email} takeover bug and need a human eye before removal.
 *
 * SAFETY: dry-run by default. It prints exactly what it would delete and
 * changes nothing. Re-run with `--apply` to actually delete.
 *
 *   # inspect only (no writes):
 *   MONGO_URI="<prod connection string>" node scripts/purgeStaleVendors.js
 *
 *   # actually delete after reviewing the dry-run output:
 *   MONGO_URI="<prod connection string>" node scripts/purgeStaleVendors.js --apply
 *
 * The connection string is read from MONGO_URI only — it is never hard-coded
 * and never printed.
 */

const APPLY = process.argv.includes('--apply');

// Known stale identity. Matched case-insensitively against the whole trimmed
// field so incidental whitespace/case differences still hit. Extend this list
// if the dry-run reveals other stale variants.
const STALE_SHOP_NAMES = ['Studio Saanjh Couture'];
const STALE_OWNER_NAMES = ['Meera Kulkarni'];
const STALE_PHONES = ['+91 98230 45671'];

/** Build a case-insensitive exact-match (trimmed) regex for a literal string. */
const exact = (value) =>
  new RegExp(`^\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i');

const mongoUri = process.env.MONGO_URI;

const summarizeVendor = (v) =>
  `  _id=${v._id} uid=${v.firebaseUid} shop="${v.shopName}" owner="${v.ownerName}" phone="${v.phone}" email="${v.email}"`;

const run = async () => {
  if (!mongoUri) {
    console.error('MONGO_URI is not set. Pass it inline, e.g.:');
    console.error('  MONGO_URI="mongodb+srv://…" node scripts/purgeStaleVendors.js');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(`Connected. Mode: ${APPLY ? 'APPLY (will delete)' : 'DRY RUN (no writes)'}\n`);

  // 1. Stale / leaked vendor record(s).
  const staleQuery = {
    $or: [
      ...STALE_SHOP_NAMES.map((s) => ({ shopName: exact(s) })),
      ...STALE_OWNER_NAMES.map((s) => ({ ownerName: exact(s) })),
      ...STALE_PHONES.map((s) => ({ phone: exact(s) })),
    ],
  };

  const staleVendors = await Vendor.find(staleQuery);
  console.log(`Stale vendor(s) matched: ${staleVendors.length}`);
  staleVendors.forEach((v) => console.log(summarizeVendor(v)));

  const staleVendorIds = staleVendors.map((v) => v._id);
  const staleProducts = staleVendorIds.length
    ? await Product.find({ vendor: { $in: staleVendorIds } })
    : [];
  console.log(`\nProducts attached to those vendor(s): ${staleProducts.length}`);
  staleProducts.forEach((p) => console.log(`  _id=${p._id} name="${p.name}" status=${p.status}`));

  // 2. Cross-bound suspects — report only.
  const allVendors = await Vendor.find({}, 'firebaseUid shopName ownerName email');
  const suspects = [];
  for (const v of allVendors) {
    const user = await User.findOne({ firebaseUid: v.firebaseUid }, 'email name');
    if (user && user.email && v.email && user.email.toLowerCase() !== v.email.toLowerCase()) {
      suspects.push({ v, user });
    }
  }
  console.log(`\nCross-bound suspects (vendor uid also owns a customer with a DIFFERENT email) — REVIEW MANUALLY, not deleted: ${suspects.length}`);
  suspects.forEach(({ v, user }) =>
    console.log(`  vendor _id=${v._id} uid=${v.firebaseUid} shop="${v.shopName}" vendorEmail="${v.email}" | customerEmail="${user.email}"`)
  );

  // Apply deletions.
  if (APPLY && staleVendorIds.length) {
    const prod = await Product.deleteMany({ vendor: { $in: staleVendorIds } });
    const vend = await Vendor.deleteMany({ _id: { $in: staleVendorIds } });
    console.log(`\nDeleted ${prod.deletedCount} product(s) and ${vend.deletedCount} vendor(s).`);
  } else if (!APPLY) {
    console.log('\nDry run complete — nothing was deleted. Re-run with --apply to delete the stale vendor(s) and their products.');
  } else {
    console.log('\nNothing to delete.');
  }

  await mongoose.disconnect();
  console.log('Disconnected.');
};

run().catch(async (err) => {
  console.error('Purge failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch {
    /* already disconnected */
  }
  process.exit(1);
});
