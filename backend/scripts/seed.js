/**
 * Seed a real MongoDB with demo data so a freshly-connected database is usable
 * end-to-end: approved shops near Nagpur, approved products (with margin), a
 * customer, an admin, and default platform settings.
 *
 *   MONGO_URI=... ADMIN_EMAIL=ops@kyapehnu.shop ADMIN_PASSWORD='min-10-chars' \
 *   npm run seed
 *
 * Idempotent per firebaseUid/email — safe to re-run. Intended for dev/staging.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

import connectDB from '../config/db.js';
import Vendor from '../models/Vendor.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import { getSettings } from '../models/PlatformSetting.js';
import { rupeesToPaise } from '../lib/money.js';
import { log } from '../lib/logger.js';

// Nagpur landmarks, [lng, lat].
const NAGPUR = { sitabuldi: [79.0806, 21.1466], dharampeth: [79.0668, 21.1385] };

const VENDORS = [
  {
    firebaseUid: 'seed-vendor-sitabuldi',
    shopName: 'Sitabuldi Threads',
    ownerName: 'Rhea Kapoor',
    phone: '9990000001',
    whatsappNumber: '9990000001',
    email: 'sitabuldi.threads@example.com',
    address: { line1: '12 Main Road', area: 'Sitabuldi', city: 'Nagpur', pincode: '440012' },
    location: { type: 'Point', coordinates: NAGPUR.sitabuldi },
    status: 'APPROVED',
  },
  {
    firebaseUid: 'seed-vendor-dharampeth',
    shopName: 'Dharampeth Drapes',
    ownerName: 'Aditya Rao',
    phone: '9990000002',
    whatsappNumber: '9990000002',
    email: 'dharampeth.drapes@example.com',
    address: { line1: '5 West High Court Rd', area: 'Dharampeth', city: 'Nagpur', pincode: '440010' },
    location: { type: 'Point', coordinates: NAGPUR.dharampeth },
    status: 'APPROVED',
  },
];

const productsFor = (vendor) => [
  {
    vendor: vendor._id,
    name: 'Linen Kurta',
    description: 'Breathable summer kurta',
    category: 'MEN',
    subCategory: 'Kurta',
    basePricePaise: rupeesToPaise(1200),
    marginPaise: rupeesToPaise(150),
    status: 'APPROVED',
    sizes: [
      { size: 'M', stock: 8 },
      { size: 'L', stock: 5 },
    ],
    colors: ['Ivory', 'Charcoal'],
  },
  {
    vendor: vendor._id,
    name: 'Crimson Wrap Dress',
    description: 'Evening wrap dress',
    category: 'WOMEN',
    subCategory: 'Dress',
    basePricePaise: rupeesToPaise(2200),
    marginPaise: rupeesToPaise(300),
    status: 'APPROVED',
    sizes: [
      { size: 'S', stock: 4 },
      { size: 'M', stock: 6 },
    ],
    colors: ['Crimson'],
  },
];

const upsertVendor = async (data) => {
  const existing = await Vendor.findOne({ firebaseUid: data.firebaseUid });
  if (existing) {
    Object.assign(existing, data);
    await existing.save();
    return existing;
  }
  return Vendor.create(data);
};

const run = async () => {
  await connectDB(process.env.MONGO_URI, { syncIndexes: true });

  await getSettings(); // ensure platform settings exist

  for (const vData of VENDORS) {
    const vendor = await upsertVendor(vData);
    for (const p of productsFor(vendor)) {
      const exists = await Product.findOne({ vendor: vendor._id, name: p.name });
      if (!exists) await Product.create(p);
    }
    log.info('Seeded vendor', { shop: vendor.shopName });
  }

  await User.findOneAndUpdate(
    { firebaseUid: 'seed-customer' },
    {
      firebaseUid: 'seed-customer',
      name: 'Demo Customer',
      email: 'demo.customer@example.com',
      phone: '9990000009',
      role: 'CUSTOMER',
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const passwordHash = await Admin.hashPassword(process.env.ADMIN_PASSWORD);
    await Admin.findOneAndUpdate(
      { email: process.env.ADMIN_EMAIL.toLowerCase() },
      {
        email: process.env.ADMIN_EMAIL.toLowerCase(),
        name: process.env.ADMIN_NAME || 'Ops',
        role: process.env.ADMIN_ROLE || 'SUPER_ADMIN',
        passwordHash,
        isActive: true,
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
    log.info('Seeded admin', { email: process.env.ADMIN_EMAIL });
  }

  log.info('Seed complete');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  log.error('Seed failed', { error: err.message });
  process.exit(1);
});
