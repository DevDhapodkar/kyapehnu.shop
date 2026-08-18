/**
 * Seed a couple of real vendor accounts into the connected Firebase project, so
 * the vendor desk has live data to read. Idempotent.
 *
 *   cd backend && npm run seed:vendors
 *
 * For each vendor it:
 *   1. creates (or updates) a Firebase Auth account with a known password,
 *   2. sets users/{uid}.role = VENDOR (so login lands on the order desk),
 *   3. writes the vendors/{uid} shop profile,
 *   4. links the seeded products whose storeName matches (sets vendorUid), and
 *   5. seeds a few demo orders/{id} for the shop.
 *
 * Requires the Admin service account in backend/.env. Prints the demo login
 * credentials at the end.
 */

import 'dotenv/config';

import { firebaseAuth, firestore } from '../config/firebase.js';

const PASSWORD = 'KyaPehnu@123';

const VENDORS = [
  {
    email: 'atelier@kyapehnu.shop',
    shopName: 'Atelier Dharampeth',
    ownerName: 'Meera Kulkarni',
    phone: '9876500001',
    whatsappNumber: '919876500001',
    address: { line1: 'Shop 14, WHC Road', area: 'Dharampeth', city: 'Nagpur', pincode: '440010' },
    location: { latitude: 21.135, longitude: 79.068 },
  },
  {
    email: 'house@kyapehnu.shop',
    shopName: 'House of Civil Lines',
    ownerName: 'Ananya Deshpande',
    phone: '9876500002',
    whatsappNumber: '919876500002',
    address: { line1: 'Bungalow 6', area: 'Civil Lines', city: 'Nagpur', pincode: '440001' },
    location: { latitude: 21.155, longitude: 79.07 },
  },
];

// A few demo customers to attribute orders to.
const CUSTOMERS = [
  { name: 'Priya Nair', phone: '9822011111', address: { line1: '3 Palm Road', city: 'Nagpur', pincode: '440010' } },
  { name: 'Arjun Mehta', phone: '9822022222', address: { line1: '88 Ramdaspeth', city: 'Nagpur', pincode: '440010' } },
  { name: 'Sana Kapoor', phone: '9822033333', address: { line1: '5 Laxmi Nagar', city: 'Nagpur', pincode: '440022' } },
];

const ensureAuthUser = async ({ email, shopName }) => {
  try {
    const user = await firebaseAuth.getUserByEmail(email);
    await firebaseAuth.updateUser(user.uid, { password: PASSWORD, displayName: shopName });
    return user;
  } catch {
    return firebaseAuth.createUser({ email, password: PASSWORD, displayName: shopName, emailVerified: true });
  }
};

const linkProducts = async (uid, shopName) => {
  const snap = await firestore.collection('products').where('storeName', '==', shopName).get();
  const batch = firestore.batch();
  snap.docs.forEach((d) => batch.update(d.ref, { vendorUid: uid }));
  await batch.commit();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

const seedOrders = async (uid, products) => {
  if (!products.length) return 0;
  const now = Date.now();
  const statuses = ['PENDING', 'PENDING', 'ACCEPTED'];

  for (let i = 0; i < statuses.length; i += 1) {
    const product = products[i % products.length];
    const customer = CUSTOMERS[i % CUSTOMERS.length];
    const size = Array.isArray(product.sizes) && product.sizes.length
      ? (typeof product.sizes[0] === 'string' ? product.sizes[0] : product.sizes[0].size)
      : 'M';
    const quantity = 1 + (i % 2);
    const items = [{ product: product.id, name: product.name, size, quantity, price: product.price }];
    const totalPrice = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

    // Stable, idempotent order id per vendor+slot.
    const orderId = `seed-order-${uid.slice(0, 8)}-${i}`;
    await firestore.collection('orders').doc(orderId).set(
      {
        vendorUid: uid,
        status: statuses[i],
        items,
        totalPrice,
        customer: { name: customer.name, phone: customer.phone },
        deliveryAddress: customer.address,
        createdAt: new Date(now - (i + 1) * 22 * 60000).toISOString(), // staggered ages
      },
      { merge: true }
    );
  }
  return statuses.length;
};

const main = async () => {
  for (const v of VENDORS) {
    const user = await ensureAuthUser(v);

    await firestore.collection('users').doc(user.uid).set(
      { uid: user.uid, email: v.email, name: v.ownerName, role: 'VENDOR' },
      { merge: true }
    );

    await firestore.collection('vendors').doc(user.uid).set(
      {
        uid: user.uid,
        email: v.email,
        shopName: v.shopName,
        ownerName: v.ownerName,
        phone: v.phone,
        whatsappNumber: v.whatsappNumber,
        address: v.address,
        location: v.location,
        isActive: true,
        rating: 4.7,
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );

    const products = await linkProducts(user.uid, v.shopName);
    const orderCount = await seedOrders(user.uid, products);

    console.log(`✓ ${v.shopName} <${v.email}> — ${products.length} products linked, ${orderCount} demo orders`);
  }

  console.log('\nDemo vendor logins (email / password):');
  VENDORS.forEach((v) => console.log(`  ${v.email}  /  ${PASSWORD}`));
  process.exit(0);
};

main().catch((error) => {
  console.error('✗ Vendor seed failed:', error.message);
  process.exit(1);
});
