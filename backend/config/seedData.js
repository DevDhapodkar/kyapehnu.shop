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
    sku: 'WM-1088',
    name: 'Chanderi Silk Banarasi Zari Saree',
    description:
      'Handcrafted authentic Chanderi silk saree with intricate golden zari floral pallu and handcrafted borders. Handpicked and tailored in Sitabuldi, Nagpur.',
    category: 'WOMEN',
    subCategory: 'Saree',
    price: 3499,
    mrp: 5999,
    brand: 'Dhapodkar Silks',
    material: 'Pure Chanderi Silk',
    pattern: 'Zardozi Embroidered',
    fit: 'Regular Fit',
    occasion: 'Festive & Wedding',
    careInstructions: 'Dry Clean Only',
    netQuantity: 1,
    countryOfOrigin: 'India',
    colors: [
      { name: 'Rani Pink', hex: '#E11D48' },
      { name: 'Haldi Yellow', hex: '#EAB308' },
      { name: 'Royal Peacock Blue', hex: '#0284C7' },
    ],
    sizes: [{ size: 'FREE', stock: 15 }],
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Pure handloom Chanderi silk with golden zari',
      'Comes with matching unstitched blouse piece',
      'Authentic Nagpur boutique craftsmanship',
    ],
  },
  {
    sku: 'MN-2045',
    name: 'Royal Angrakha Raw Silk Men Kurta',
    description:
      'Royal festive Angrakha overlapping style men kurta tailored from premium textured raw silk with brass finish ornamental buttons.',
    category: 'MEN',
    subCategory: 'Kurta',
    price: 2499,
    mrp: 3999,
    brand: 'Dhapodkar Silks',
    material: 'Raw Silk',
    pattern: 'Woven Jacquard',
    fit: 'Tailored',
    sleeve: 'Full Sleeves',
    neck: 'Angrakha V-Neck',
    occasion: 'Festive & Wedding',
    careInstructions: 'Dry Clean Only',
    netQuantity: 1,
    countryOfOrigin: 'India',
    colors: [
      { name: 'Classic Ivory', hex: '#F9F6F0' },
      { name: 'Terracotta Rust', hex: '#C2410C' },
      { name: 'Forest Emerald', hex: '#047857' },
    ],
    sizes: [
      { size: 'M', stock: 8 },
      { size: 'L', stock: 12 },
      { size: 'XL', stock: 6 },
    ],
    images: [
      'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1200&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Overlapping Angrakha style with traditional ties',
      'Textured raw silk breathable weave',
      'Dry clean recommended for long-lasting sheen',
    ],
  },
];

const ANAMIKA_PRODUCT = {
  sku: 'AN-7701',
  name: 'Sitabuldi Handloom Zari Kurta',
  description: 'Handwoven in Nagpur with pure mulberry silk and antique zari work.',
  category: 'WOMEN',
  subCategory: 'Kurta',
  price: 5200,
  mrp: 6999,
  brand: 'Studio Anamika',
  material: 'Pure Chanderi Mulberry Silk',
  pattern: 'Handloom Antique Zari',
  fit: 'Tailored Regular',
  sleeve: 'Three-Quarter',
  neck: 'Angrakha V-Neck',
  occasion: 'Festive & Wedding',
  careInstructions: 'Dry Clean Only',
  netQuantity: 1,
  countryOfOrigin: 'India',
  returnPolicy: '7-day return',
  colors: [
    { name: 'Peacock Teal', hex: '#0F766E' },
    { name: 'Heritage Gold', hex: '#D97706' },
  ],
  sizes: [
    { size: 'S', stock: 4 },
    { size: 'M', stock: 6 },
  ],
  images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900'],
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
    const vendor = await upsertVendor(DEV_VENDOR);

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
    const boutique = await upsertVendor(ANAMIKA_VENDOR);
    const { sku, ...rest } = ANAMIKA_PRODUCT;
    await upsertProduct(boutique._id, sku, rest);
  });

  const approved = await Product.countDocuments({
    status: PRODUCT_STATUS.APPROVED,
    isAvailable: true,
  });
  console.log(`[Bootstrap] storefront catalog ready: ${approved} approved product(s).`);
};
