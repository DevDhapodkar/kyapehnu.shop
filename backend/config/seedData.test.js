import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Vendor from '../models/Vendor.js';
import { resolveSeedVendor } from './seedData.js';

dotenv.config();

// resolveSeedVendor must be idempotent AND must never collide on the unique
// email index when a real account has claimed the seed vendor's email under a
// different Firebase UID — the E11000-on-every-boot bug this guards against.
test('resolveSeedVendor: seed vendor identity', async (t) => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kyapehnu');

  const stamp = Date.now();
  const email = `seedtest_${stamp}@kyapehnu.local`;
  const seed = {
    firebaseUid: `seed_uid_${stamp}`,
    shopName: 'Seed Demo Shop',
    ownerName: 'Seed Owner',
    email,
    phone: '+91 90000 00000',
    whatsappNumber: '+91 90000 00000',
    address: { line1: '1 Seed Rd', area: 'Sitabuldi', city: 'Nagpur', pincode: '440012' },
    location: { type: 'Point', coordinates: [79.08, 21.14] },
  };
  const createdIds = [];

  t.after(async () => {
    if (createdIds.length) await Vendor.deleteMany({ _id: { $in: createdIds } });
    await mongoose.disconnect();
  });

  await t.test('creates the seed vendor when none exists', async () => {
    const vendor = await resolveSeedVendor(seed);
    createdIds.push(vendor._id);
    assert.equal(vendor.firebaseUid, seed.firebaseUid);
    assert.equal(vendor.approvalStatus, 'APPROVED');
    assert.equal(vendor.isActive, true);
  });

  await t.test('is idempotent on a second run (no duplicate, no throw)', async () => {
    const again = await resolveSeedVendor(seed);
    assert.equal(String(again._id), String(createdIds[0]), 'must reuse the same document');
    const count = await Vendor.countDocuments({ email });
    assert.equal(count, 1, 'must not create a duplicate vendor');
  });

  await t.test(
    'reuses a real account that owns the email under a different UID (no E11000)',
    async () => {
      // Simulate the production state: a real vendor registered on this email
      // with its own Firebase UID, and it is PENDING.
      const realEmail = `seedtest_real_${stamp}@kyapehnu.local`;
      const real = await Vendor.create({
        ...seed,
        firebaseUid: `real_uid_${stamp}`,
        email: realEmail,
        approvalStatus: 'PENDING',
        isActive: false,
      });
      createdIds.push(real._id);

      // A seed whose synthetic UID differs but whose email collides with `real`.
      const collidingSeed = { ...seed, firebaseUid: `seed_uid_other_${stamp}`, email: realEmail };

      const resolved = await resolveSeedVendor(collidingSeed);

      assert.equal(String(resolved._id), String(real._id), 'must reuse the real vendor');
      assert.equal(resolved.firebaseUid, `real_uid_${stamp}`, 'must NOT rewrite the real UID');
      assert.equal(resolved.approvalStatus, 'APPROVED', 'must approve it for the demo');
      assert.equal(resolved.isActive, true, 'must activate it for the demo');

      const count = await Vendor.countDocuments({ email: realEmail });
      assert.equal(count, 1, 'must not insert a duplicate on the taken email');
    }
  );
});
