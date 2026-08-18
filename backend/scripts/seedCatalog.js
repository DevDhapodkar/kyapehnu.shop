/**
 * Seed the storefront with demo vendors and products, so `/api/products` serves
 * real data out of MongoDB. Idempotent: vendors are upserted by firebaseUid and
 * products by (vendor, name), so re-running refreshes rather than duplicates.
 *
 *   cd backend && npm run seed:catalog
 *
 * These are demo shops (synthetic firebaseUid `seed-*`) purely to populate the
 * browse experience for development and pilots; remove them once real vendors
 * are onboarded via the admin flow.
 */

import 'dotenv/config';
import mongoose from 'mongoose';

import connectDB from '../config/db.js';
import Vendor from '../models/Vendor.js';
import Product from '../models/Product.js';

const img = (seed) => `https://picsum.photos/seed/kyapehnu-${seed}/900/1200`;
const sizes = (list) => list.map((size) => ({ size, stock: 8 }));

const VENDORS = [
  {
    firebaseUid: 'seed-atelier-dharampeth',
    shopName: 'Atelier Dharampeth',
    ownerName: 'Meera Kulkarni',
    phone: '9876500001',
    whatsappNumber: '919876500001',
    email: 'atelier.seed@kyapehnu.shop',
    address: { line1: 'Shop 14, WHC Road', area: 'Dharampeth', city: 'Nagpur', pincode: '440010' },
    location: { type: 'Point', coordinates: [79.068, 21.135] },
  },
  {
    firebaseUid: 'seed-house-civillines',
    shopName: 'House of Civil Lines',
    ownerName: 'Ananya Deshpande',
    phone: '9876500002',
    whatsappNumber: '919876500002',
    email: 'house.seed@kyapehnu.shop',
    address: { line1: 'Bungalow 6', area: 'Civil Lines', city: 'Nagpur', pincode: '440001' },
    location: { type: 'Point', coordinates: [79.07, 21.155] },
  },
  {
    firebaseUid: 'seed-campus-wathoda',
    shopName: 'Campus Edit — Wathoda',
    ownerName: 'Rohan Pillai',
    phone: '9876500003',
    whatsappNumber: '919876500003',
    email: 'campus.seed@kyapehnu.shop',
    address: { line1: 'Plot 3, Ring Road', area: 'Wathoda', city: 'Nagpur', pincode: '440035' },
    location: { type: 'Point', coordinates: [79.147, 21.0972] },
  },
];

// vendorKey → products. Category is the department; subCategory is the type.
const PRODUCTS = {
  'seed-atelier-dharampeth': [
    { name: 'Obsidian Evening Shirt', category: 'MEN', subCategory: 'Shirts', price: 5600, discountPrice: 4200, colors: ['Obsidian Black'], sizes: sizes(['S', 'M', 'L', 'XL']), images: [img('obsidian-shirt')], description: 'Long in the body, narrow through the sleeve, hand-rolled placket.' },
    { name: 'Ivory Silk-Cotton Kurta', category: 'MEN', subCategory: 'Ethnic', price: 4600, discountPrice: 3800, colors: ['Raw Ivory'], sizes: sizes(['S', 'M', 'L', 'XL', 'XXL']), images: [img('ivory-kurta')], description: 'Straight fall, side slits, no embroidery.' },
    { name: 'Charcoal Wool Overshirt', category: 'MEN', subCategory: 'Outerwear', price: 8400, discountPrice: 6900, colors: ['Charcoal Melange'], sizes: sizes(['M', 'L', 'XL']), images: [img('charcoal-overshirt')], description: 'A shirt heavy enough to be a jacket.' },
  ],
  'seed-house-civillines': [
    { name: 'Crimson Bias-Cut Slip Dress', category: 'WOMEN', subCategory: 'Dresses', price: 11500, discountPrice: 8900, colors: ['Deep Crimson'], sizes: sizes(['XS', 'S', 'M', 'L']), images: [img('crimson-slip')], description: 'Cut on the bias so it moves before you do.' },
    { name: 'Emerald Silk Wrap Saree', category: 'WOMEN', subCategory: 'Ethnic', price: 18900, discountPrice: 14500, colors: ['Deep Emerald'], sizes: sizes(['Free']), images: [img('emerald-saree')], description: 'A single unbroken drape with a hand-woven zari edge.' },
    { name: 'Ink Wide-Leg Trousers', category: 'WOMEN', subCategory: 'Bottoms', price: 6400, discountPrice: 5200, colors: ['Ink Navy'], sizes: sizes(['XS', 'S', 'M', 'L']), images: [img('ink-trousers')], description: 'A high, clean waist falling straight to a full break.' },
    { name: 'Ivory Dial Dress Automatic', category: 'WATCHES', subCategory: 'Dress', price: 39900, discountPrice: 33200, colors: ['Ivory / Rose Steel'], sizes: sizes(['37mm', '40mm']), images: [img('dress-automatic')], description: 'Seven millimetres thin with an open caseback.' },
  ],
  'seed-campus-wathoda': [
    { name: 'Heavyweight Boxy Tee', category: 'MEN', subCategory: 'T-Shirts', price: 1900, discountPrice: 1450, colors: ['Washed Black'], sizes: sizes(['S', 'M', 'L', 'XL', 'XXL']), images: [img('heavyweight-tee')], description: 'Boxy through the body, ribbed at the collar.' },
    { name: 'Kids Breton Stripe Tee', category: 'KIDS', subCategory: 'T-Shirts', price: 1100, discountPrice: 780, colors: ['Ecru / Navy'], sizes: sizes(['2-3Y', '4-5Y', '6-7Y', '8-9Y']), images: [img('kids-stripe-tee')], description: 'A proper Breton stripe sized for small people.' },
    { name: 'Kids Denim Dungarees', category: 'KIDS', subCategory: 'Sets', price: 2200, discountPrice: 1650, colors: ['Mid Indigo'], sizes: sizes(['2-3Y', '4-5Y', '6-7Y']), images: [img('kids-dungarees')], description: 'Roomy through the knee for the falling-over years.' },
    { name: 'Gunmetal Arm Cuff', category: 'ACCESSORIES', subCategory: 'Arm Cuffs', price: 3100, discountPrice: 2400, colors: ['Brushed Gunmetal'], sizes: sizes(['Adjustable']), images: [img('gunmetal-cuff')], description: 'An open-back cuff that sits above the wrist bone.' },
    { name: 'Campus Automatic 38', category: 'WATCHES', subCategory: 'Automatic', price: 19900, discountPrice: 16400, colors: ['Graphite / Steel'], sizes: sizes(['38mm']), images: [img('campus-automatic')], description: 'The cheapest way into a real mechanical movement in this city.' },
  ],
};

const main = async () => {
  await connectDB();

  let vendorCount = 0;
  let productCount = 0;

  for (const v of VENDORS) {
    const vendor = await Vendor.findOneAndUpdate(
      { firebaseUid: v.firebaseUid },
      v,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    vendorCount += 1;

    for (const p of PRODUCTS[v.firebaseUid] ?? []) {
      await Product.findOneAndUpdate(
        { vendor: vendor._id, name: p.name },
        { ...p, vendor: vendor._id, isAvailable: true },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      productCount += 1;
    }
  }

  console.log(`✓ Seeded ${vendorCount} vendors and ${productCount} products.`);
  await mongoose.connection.close();
  process.exit(0);
};

main().catch((error) => {
  console.error('✗ Seed failed:', error.message);
  process.exit(1);
});
