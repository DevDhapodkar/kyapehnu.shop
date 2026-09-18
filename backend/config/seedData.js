import Vendor from '../models/Vendor.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { PRODUCT_STATUS, PRODUCT_SOURCE } from '../utils/productStatus.js';

/**
 * Idempotent baseline catalog so a fresh (or messy) database always serves a
 * non-empty storefront. Runs on every boot (server.js).
 *
 * Everything here upserts on a stable unique key (vendor firebaseUid, product
 * sku) and forces the storefront-visible state (approvalStatus/status =
 * APPROVED, isAvailable = true). This is deliberate — the previous version used
 * `create` guarded by "does this vendor have zero products", which broke on any
 * non-clean database in two ways this file must never regress:
 *   - a leftover non-APPROVED product tripped the count guard, so the APPROVED
 *     demo products were never created and the catalog stayed empty; and
 *   - a renamed/duplicate seed vendor made `Vendor.create` throw E11000, which
 *     the outer try/catch swallowed, aborting the whole seed.
 * Upserts + per-entity error isolation remove both failure modes.
 */

const DEV_VENDOR = {
  firebaseUid: 'vendor_dhapodkardev',
  shopName: 'Dhapodkar Handlooms & Silks',
  ownerName: 'Dev Dhapodkar',
  email: 'dhapodkardev@gmail.com',
  phone: '+91 98765 43210',
  whatsappNumber: '+91 98765 43210',
  address: { line1: 'Main Market, Variety Square', area: 'Sitabuldi', city: 'Nagpur', pincode: '440012' },
  location: { type: 'Point', coordinates: [79.0833, 21.1466] },
  operatingHours: [
    { day: 'MON', open: '10:00', close: '21:00', closed: false },
    { day: 'TUE', open: '10:00', close: '21:00', closed: false },
    { day: 'WED', open: '10:00', close: '21:00', closed: false },
    { day: 'THU', open: '10:00', close: '21:00', closed: false },
    { day: 'FRI', open: '10:00', close: '21:00', closed: false },
    { day: 'SAT', open: '10:00', close: '21:00', closed: false },
    { day: 'SUN', open: '11:00', close: '20:00', closed: false },
  ],
  rating: 4.9,
};

const ANAMIKA_VENDOR = {
  firebaseUid: 'seed_vendor_anamika',
  shopName: 'Studio Anamika',
  ownerName: 'Anamika Deshmukh',
  phone: '+91 98230 44101',
  whatsappNumber: '+91 98230 44101',
  email: 'anamika@kyapehnu.local',
  address: { line1: '14, West High Court Road', area: 'Dharampeth', city: 'Nagpur', pincode: '440010' },
  location: { type: 'Point', coordinates: [79.061, 21.142] },
  rating: 4.9,
};

/** Upsert a seed vendor by its stable firebaseUid; always APPROVED + active. */
const upsertVendor = (data) =>
  Vendor.findOneAndUpdate(
    { firebaseUid: data.firebaseUid },
    { $set: { ...data, approvalStatus: 'APPROVED', isActive: true } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

/**
 * Resolve the vendor a seed step should populate.
 *
 * The dev seed vendor squats on the owner's real email. Once a real account
 * registers under that email it gets its own Firebase UID, so upserting by the
 * seed's synthetic firebaseUid misses and then tries to INSERT — colliding on
 * the unique email index (the E11000 seen on every boot). When an existing
 * vendor already holds this email under a different UID, reuse it (only forcing
 * approved + active so the demo catalogue can surface) rather than duplicating
 * it or rewriting the real account's identity. Otherwise upsert by UID as before.
 */
export const resolveSeedVendor = async (data) => {
  const existing = await Vendor.findOne({
    $or: [{ firebaseUid: data.firebaseUid }, { email: data.email }],
  });
  if (existing && existing.firebaseUid !== data.firebaseUid) {
    return Vendor.findByIdAndUpdate(
      existing._id,
      { $set: { approvalStatus: 'APPROVED', isActive: true } },
      { returnDocument: 'after' }
    );
  }
  return upsertVendor(data);
};

/** Upsert a seed product by its stable sku; always APPROVED + available. */
const upsertProduct = (vendorId, sku, data) =>
  Product.findOneAndUpdate(
    { sku },
    {
      $set: {
        ...data,
        sku,
        vendor: vendorId,
        status: PRODUCT_STATUS.APPROVED,
        source: PRODUCT_SOURCE.APP,
        isAvailable: true,
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

const DEV_PRODUCTS = [
  {
    sku: 'ST-101',
    name: 'Oversized Heavyweight Streetwear Tee',
    description:
      '240 GSM heavy cotton drop-shoulder streetwear tee with minimal graphic print. Perfect everyday boxy fit for men and women.',
    category: 'MEN',
    subCategory: 'Streetwear & Casuals',
    price: 1299,
    mrp: 1999,
    brand: 'Trend Studio Nagpur',
    material: '100% Combed Cotton',
    pattern: 'Drop Shoulder Graphic',
    fit: 'Boxy Oversized',
    occasion: 'Streetwear & Daily',
    careInstructions: 'Machine Wash Cold',
    netQuantity: 1,
    countryOfOrigin: 'India',
    colors: [
      { name: 'Pitch Black', hex: '#121215' },
      { name: 'Vintage Washed Grey', hex: '#4B5563' },
      { name: 'Chalk White', hex: '#F9FAFB' },
    ],
    sizes: [
      { size: 'S', stock: 12 },
      { size: 'M', stock: 20 },
      { size: 'L', stock: 18 },
      { size: 'XL', stock: 10 },
    ],
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Premium 240 GSM heavy French Terry cotton',
      'Relaxed drop-shoulder silhouette',
      'Delivered to your doorstep in 45 minutes',
    ],
  },
  {
    sku: 'WM-202',
    name: 'Champagne Satin Wrap Party Dress',
    description:
      'Lustrous satin midi party dress featuring an elegant surplice neckline, adjustable tie waist, and chic fluid silhouette.',
    category: 'WOMEN',
    subCategory: "Women's Wear",
    price: 2499,
    mrp: 3899,
    brand: 'Studio Chic',
    material: 'Premium Satin Blend',
    pattern: 'Solid Lustre',
    fit: 'Slim Fit Wrap',
    occasion: 'Party & Evening',
    careInstructions: 'Gentle Machine Wash or Dry Clean',
    netQuantity: 1,
    countryOfOrigin: 'India',
    colors: [
      { name: 'Champagne Gold', hex: '#E5C158' },
      { name: 'Emerald Night', hex: '#064E3B' },
      { name: 'Ruby Crimson', hex: '#C4243A' },
    ],
    sizes: [
      { size: 'XS', stock: 6 },
      { size: 'S', stock: 14 },
      { size: 'M', stock: 16 },
      { size: 'L', stock: 8 },
    ],
    images: [
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1200&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Ultra-soft high-sheen satin drape',
      'Doorstep fitting trial available',
      'Same-day 45-minute dispatch in Nagpur',
    ],
  },
];

const ANAMIKA_PRODUCT = {
  sku: 'FS-303',
  name: 'Modern Asymmetric Fusion Kurta Set',
  description: 'Contemporary structured linen-cotton fusion kurta paired with tapered trousers. Clean modern tailoring for festive evenings.',
  category: 'WOMEN',
  subCategory: 'Kurtas & Sets',
  price: 3450,
  mrp: 4999,
  brand: 'Studio Anamika',
  material: 'Linen Cotton Slub',
  pattern: 'Modern Minimalist',
  fit: 'Relaxed Tailored',
  sleeve: 'Three-Quarter',
  neck: 'Mandarin Collar',
  occasion: 'Festive & Occasion',
  careInstructions: 'Gentle Hand Wash',
  netQuantity: 1,
  countryOfOrigin: 'India',
  returnPolicy: 'Doorstep trial & easy exchange',
  colors: [
    { name: 'Crimson Rose', hex: '#C4243A' },
    { name: 'Ivory Cream', hex: '#FAF9F5' },
  ],
  sizes: [
    { size: 'S', stock: 8 },
    { size: 'M', stock: 12 },
    { size: 'L', stock: 6 },
  ],
  images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80'],
};

/** Run one seed step in isolation so one failure never aborts the rest. */
const step = async (label, fn) => {
  try {
    await fn();
  } catch (error) {
    console.error(`[Bootstrap] step "${label}" failed:`, error.message);
  }
};

export const ensureBootstrapData = async () => {
  await step('dev vendor', async () => {
    const vendor = await resolveSeedVendor(DEV_VENDOR);

    // A customer User for the dev account (never overwrite a real user's data).
    await User.findOneAndUpdate(
      { email: DEV_VENDOR.email.toLowerCase() },
      {
        $setOnInsert: {
          firebaseUid: DEV_VENDOR.firebaseUid,
          name: DEV_VENDOR.ownerName,
          phone: DEV_VENDOR.phone,
          savedAddresses: [
            {
              label: 'Shop',
              line1: 'Main Market, Variety Square',
              city: 'Nagpur',
              pincode: '440012',
              location: { type: 'Point', coordinates: [79.0833, 21.1466] },
            },
          ],
          currentLocation: { type: 'Point', coordinates: [79.0833, 21.1466] },
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    for (const p of DEV_PRODUCTS) {
      const { sku, ...rest } = p;
      await upsertProduct(vendor._id, sku, rest);
    }
  });

  await step('sample boutique', async () => {
    const boutique = await resolveSeedVendor(ANAMIKA_VENDOR);
    const { sku, ...rest } = ANAMIKA_PRODUCT;
    await upsertProduct(boutique._id, sku, rest);
  });

  const approved = await Product.countDocuments({
    status: PRODUCT_STATUS.APPROVED,
    isAvailable: true,
  });
  console.log(`[Bootstrap] storefront catalog ready: ${approved} approved product(s).`);
};
