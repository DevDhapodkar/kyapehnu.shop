/**
 * Seed the Cloud Firestore `products` collection with demo data, so the app's
 * shopping experience reads real data straight from Firebase — no Express server
 * or MongoDB required. Idempotent: each product has a stable doc id, so
 * re-running refreshes rather than duplicates.
 *
 *   cd backend && npm run seed:firestore
 *
 * Requires the Firebase Admin service account in backend/.env
 * (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY). Get the
 * key from: Firebase console → Project settings → Service accounts →
 * Generate new private key.
 *
 * Documents are stored in the UI shape the app renders directly, and each
 * carries `storeLocation` so the "nearest to you" rail can compute real
 * distances from the shopper's GPS.
 */

import 'dotenv/config';

import { firestore } from '../config/firebase.js';

const img = (seed) => `https://picsum.photos/seed/kyapehnu-${seed}/900/1200`;

const STORES = {
  atelier: { storeId: 'atelier-dharampeth', storeName: 'Atelier Dharampeth', storeArea: 'Dharampeth', storeLocation: { latitude: 21.135, longitude: 79.068 } },
  house: { storeId: 'house-civillines', storeName: 'House of Civil Lines', storeArea: 'Civil Lines', storeLocation: { latitude: 21.155, longitude: 79.07 } },
  horology: { storeId: 'ramdaspeth-horology', storeName: 'Ramdaspeth Horology Co.', storeArea: 'Ramdaspeth', storeLocation: { latitude: 21.131, longitude: 79.074 } },
  campus: { storeId: 'campus-wathoda', storeName: 'Campus Edit — Wathoda', storeArea: 'Wathoda', storeLocation: { latitude: 21.0972, longitude: 79.147 } },
};

// Each entry: [docId, store, department, type, name, price, mrp, colorway, sizes, imgSeed, description]
const ROWS = [
  ['obsidian-shirt', 'atelier', 'MEN', 'Shirts', 'Obsidian Evening Shirt', 4200, 5600, 'Obsidian Black', ['S', 'M', 'L', 'XL'], 'obsidian-shirt', 'Long in the body, narrow through the sleeve, hand-rolled placket.'],
  ['ivory-kurta', 'atelier', 'MEN', 'Ethnic', 'Ivory Silk-Cotton Kurta', 3800, 4600, 'Raw Ivory', ['S', 'M', 'L', 'XL', 'XXL'], 'ivory-kurta', 'Straight fall, side slits, no embroidery.'],
  ['charcoal-overshirt', 'atelier', 'MEN', 'Outerwear', 'Charcoal Wool Overshirt', 6900, 8400, 'Charcoal Melange', ['M', 'L', 'XL'], 'charcoal-overshirt', 'A shirt heavy enough to be a jacket.'],
  ['heavyweight-tee', 'campus', 'MEN', 'T-Shirts', 'Heavyweight Boxy Tee', 1450, 1900, 'Washed Black', ['S', 'M', 'L', 'XL', 'XXL'], 'heavyweight-tee', 'Boxy through the body, ribbed at the collar.'],
  ['crimson-slip', 'house', 'WOMEN', 'Dresses', 'Crimson Bias-Cut Slip Dress', 8900, 11500, 'Deep Crimson', ['XS', 'S', 'M', 'L'], 'crimson-slip', 'Cut on the bias so it moves before you do.'],
  ['emerald-saree', 'house', 'WOMEN', 'Ethnic', 'Emerald Silk Wrap Saree', 14500, 18900, 'Deep Emerald', ['Free'], 'emerald-saree', 'A single unbroken drape with a hand-woven zari edge.'],
  ['ink-trousers', 'house', 'WOMEN', 'Bottoms', 'Ink Wide-Leg Trousers', 5200, 6400, 'Ink Navy', ['XS', 'S', 'M', 'L'], 'ink-trousers', 'A high, clean waist falling straight to a full break.'],
  ['blush-linen-shirt', 'house', 'WOMEN', 'Shirts', 'Blush Linen Shirt', 3600, 4500, 'Blush', ['XS', 'S', 'M', 'L', 'XL'], 'blush-linen-shirt', 'Relaxed through the shoulder with a low patch pocket.'],
  ['kids-stripe-tee', 'campus', 'KIDS', 'T-Shirts', 'Kids Breton Stripe Tee', 780, 1100, 'Ecru / Navy', ['2-3Y', '4-5Y', '6-7Y', '8-9Y'], 'kids-stripe-tee', 'A proper Breton stripe sized for small people.'],
  ['kids-dungarees', 'campus', 'KIDS', 'Sets', 'Kids Denim Dungarees', 1650, 2200, 'Mid Indigo', ['2-3Y', '4-5Y', '6-7Y'], 'kids-dungarees', 'Roomy through the knee for the falling-over years.'],
  ['diver-automatic', 'horology', 'WATCHES', 'Automatic', 'Skin-Diver Automatic 200M', 28500, 34000, 'Matte Black / Steel', ['38mm', '41mm'], 'diver-automatic', 'Screw-down crown, 120-click bezel, 41-hour reserve.'],
  ['dress-automatic', 'horology', 'WATCHES', 'Dress', 'Ivory Dial Dress Automatic', 33200, 39900, 'Ivory / Rose Steel', ['37mm', '40mm'], 'dress-automatic', 'Seven millimetres thin with an open caseback.'],
  ['campus-automatic', 'campus', 'WATCHES', 'Automatic', 'Campus Automatic 38', 16400, 19900, 'Graphite / Steel', ['38mm'], 'campus-automatic', 'The cheapest way into a real mechanical movement in this city.'],
  ['gunmetal-cuff', 'campus', 'ACCESSORIES', 'Arm Cuffs', 'Gunmetal Arm Cuff', 2400, 3100, 'Brushed Gunmetal', ['Adjustable'], 'gunmetal-cuff', 'An open-back cuff that sits above the wrist bone.'],
  ['cord-bracelet', 'atelier', 'ACCESSORIES', 'Bracelets', 'Waxed Cord Bracelet Stack', 900, 1300, 'Black / Sand', ['Adjustable'], 'cord-bracelet', 'A set of three, knotted to slide over the hand.'],
];

const toDoc = ([id, storeKey, department, type, name, price, mrp, colorway, sizes, seed, description]) => {
  const store = STORES[storeKey];
  return {
    id,
    doc: {
      name,
      description,
      department,
      type,
      category: type,
      price,
      mrp,
      colorway,
      image: img(seed),
      images: [img(seed)],
      sizes,
      ...store,
      isAvailable: true,
      createdAt: new Date().toISOString(),
    },
  };
};

const main = async () => {
  const rows = ROWS.map(toDoc);
  const batch = firestore.batch();
  for (const { id, doc } of rows) {
    batch.set(firestore.collection('products').doc(id), doc, { merge: true });
  }
  await batch.commit();
  console.log(`✓ Seeded ${rows.length} products into Firestore (collection: products).`);
  process.exit(0);
};

main().catch((error) => {
  console.error('✗ Firestore seed failed:', error.message);
  process.exit(1);
});
