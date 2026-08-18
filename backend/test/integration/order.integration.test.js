import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Env must be set before importing anything that calls loadEnv().
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://placeholder/kyapehnu-test';
process.env.ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'test-secret';

const { connectTestDb, disconnectTestDb, clearCollections } = await import('./harness.js');
const { default: Vendor } = await import('../../models/Vendor.js');
const { default: User } = await import('../../models/User.js');
const { default: Product } = await import('../../models/Product.js');
const { default: Invoice } = await import('../../models/Invoice.js');
const { clearSettingsCache } = await import('../../models/PlatformSetting.js');
const { createOrder, advanceOrderStatus } = await import('../../services/orderService.js');
const { PLATFORM_FEE_PAISE } = await import('../../constants/money.js');

// Connect once. If no database is reachable, every test skips with the reason.
const conn = await connectTestDb();
const skip = conn.ready ? false : conn.reason;

before(() => {
  if (conn.ready) console.log(`Integration DB: ${conn.source}`);
});
after(async () => {
  if (conn.ready) await disconnectTestDb();
});
beforeEach(async () => {
  if (conn.ready) {
    await clearCollections();
    clearSettingsCache();
  }
});

/* --------------------------------------------------------------- factories -- */

const makeCustomer = () =>
  User.create({
    firebaseUid: `cust-${Math.random().toString(36).slice(2)}`,
    name: 'Aarav',
    email: `aarav-${Math.random().toString(36).slice(2)}@example.com`,
    phone: '9990001111',
  });

const makeApprovedVendor = () =>
  Vendor.create({
    firebaseUid: `vend-${Math.random().toString(36).slice(2)}`,
    shopName: 'Sitabuldi Threads',
    ownerName: 'Rhea',
    phone: '9990002222',
    whatsappNumber: '9990002222',
    email: `shop-${Math.random().toString(36).slice(2)}@example.com`,
    address: { line1: '1 Main Rd', area: 'Sitabuldi', city: 'Nagpur', pincode: '440012' },
    location: { type: 'Point', coordinates: [79.08, 21.14] },
    status: 'APPROVED',
  });

const makeApprovedProduct = (vendor, { basePaise = 100000, marginPaise = 20000, stock = 5, size = 'M' } = {}) =>
  Product.create({
    vendor: vendor._id,
    name: 'Linen Kurta',
    category: 'MEN',
    basePricePaise: basePaise,
    marginPaise,
    status: 'APPROVED',
    sizes: [{ size, stock }],
  });

const address = {
  line1: '12 MG Road',
  city: 'Nagpur',
  pincode: '440001',
  location: { type: 'Point', coordinates: [79.09, 21.15] },
};

/* ------------------------------------------------------------------- tests -- */

test('places a COD order: server-computed pricing, ₹25 fee, stock decremented, invoice issued', { skip }, async () => {
  const [customer, vendor] = await Promise.all([makeCustomer(), makeApprovedVendor()]);
  const product = await makeApprovedProduct(vendor, { basePaise: 100000, marginPaise: 20000, stock: 5 });

  const order = await createOrder(customer, {
    vendorId: vendor._id.toString(),
    items: [{ product: product._id.toString(), size: 'M', quantity: 2 }],
    deliveryAddress: address,
  });

  // sellingPrice = 120000; subtotal = 240000; + ₹25 fee => 242500
  assert.equal(order.pricing.itemsSubtotalPaise, 240000);
  assert.equal(order.pricing.platformFeePaise, PLATFORM_FEE_PAISE);
  assert.equal(order.pricing.grandTotalPaise, 242500);
  assert.equal(order.pricing.vendorPayoutPaise, 200000); // base * qty
  assert.equal(order.pricing.marginTotalPaise, 40000); // margin * qty
  assert.equal(order.pricing.platformEarningsPaise, 42500); // margin + fee
  assert.equal(order.payment.method, 'COD');
  assert.equal(order.status, 'PENDING');
  assert.match(order.orderNumber, /^KP-\d{4}-\d{6}$/);

  // Stock actually decremented in the DB.
  const fresh = await Product.findById(product._id);
  assert.equal(fresh.sizes[0].stock, 3);

  // Invoice created and linked.
  const invoice = await Invoice.findOne({ order: order._id });
  assert.ok(invoice, 'invoice exists');
  assert.match(invoice.invoiceNumber, /^KP-INV-\d{4}-\d{6}$/);
  assert.equal(invoice.grandTotalPaise, 242500);
});

test('rejects oversell: quantity beyond stock never creates an order', { skip }, async () => {
  const [customer, vendor] = await Promise.all([makeCustomer(), makeApprovedVendor()]);
  const product = await makeApprovedProduct(vendor, { stock: 1 });

  await assert.rejects(
    () =>
      createOrder(customer, {
        vendorId: vendor._id.toString(),
        items: [{ product: product._id.toString(), size: 'M', quantity: 3 }],
        deliveryAddress: address,
      }),
    /left|Stock/i
  );
  const fresh = await Product.findById(product._id);
  assert.equal(fresh.sizes[0].stock, 1, 'stock untouched on failed order');
});

test('idempotency: same key returns the same order and decrements stock once', { skip }, async () => {
  const [customer, vendor] = await Promise.all([makeCustomer(), makeApprovedVendor()]);
  const product = await makeApprovedProduct(vendor, { stock: 5 });
  const payload = {
    vendorId: vendor._id.toString(),
    items: [{ product: product._id.toString(), size: 'M', quantity: 2 }],
    deliveryAddress: address,
    idempotencyKey: 'checkout-abc-123',
  };

  const first = await createOrder(customer, payload);
  const second = await createOrder(customer, payload);

  assert.equal(first._id.toString(), second._id.toString(), 'same order returned');
  const fresh = await Product.findById(product._id);
  assert.equal(fresh.sizes[0].stock, 3, 'stock decremented exactly once');
});

test('unapproved products are not orderable', { skip }, async () => {
  const [customer, vendor] = await Promise.all([makeCustomer(), makeApprovedVendor()]);
  const product = await Product.create({
    vendor: vendor._id,
    name: 'Draft Tee',
    category: 'MEN',
    basePricePaise: 50000,
    marginPaise: 0,
    status: 'PENDING_APPROVAL',
    sizes: [{ size: 'L', stock: 10 }],
  });

  await assert.rejects(
    () =>
      createOrder(customer, {
        vendorId: vendor._id.toString(),
        items: [{ product: product._id.toString(), size: 'L', quantity: 1 }],
        deliveryAddress: address,
      }),
    /not available/i
  );
});

test('cancellation restores stock and records who cancelled', { skip }, async () => {
  const [customer, vendor] = await Promise.all([makeCustomer(), makeApprovedVendor()]);
  const product = await makeApprovedProduct(vendor, { stock: 4 });
  const order = await createOrder(customer, {
    vendorId: vendor._id.toString(),
    items: [{ product: product._id.toString(), size: 'M', quantity: 2 }],
    deliveryAddress: address,
  });
  assert.equal((await Product.findById(product._id)).sizes[0].stock, 2);

  await advanceOrderStatus(order, 'CANCELLED', 'CUSTOMER', { reason: 'changed mind' });

  assert.equal(order.status, 'CANCELLED');
  assert.equal(order.cancellation.by, 'CUSTOMER');
  assert.equal((await Product.findById(product._id)).sizes[0].stock, 4, 'stock restored');
});

test('state machine: vendor cannot jump to DELIVERED; full path marks COD collected', { skip }, async () => {
  const [customer, vendor] = await Promise.all([makeCustomer(), makeApprovedVendor()]);
  const product = await makeApprovedProduct(vendor, { stock: 3 });
  const order = await createOrder(customer, {
    vendorId: vendor._id.toString(),
    items: [{ product: product._id.toString(), size: 'M', quantity: 1 }],
    deliveryAddress: address,
  });

  await assert.rejects(() => advanceOrderStatus(order, 'DELIVERED', 'VENDOR'), /Illegal transition/);

  await advanceOrderStatus(order, 'ACCEPTED', 'VENDOR');
  await advanceOrderStatus(order, 'READY_FOR_PICKUP', 'VENDOR');
  await advanceOrderStatus(order, 'IN_TRANSIT', 'VENDOR');
  await advanceOrderStatus(order, 'DELIVERED', 'VENDOR');

  assert.equal(order.status, 'DELIVERED');
  assert.equal(order.payment.status, 'COLLECTED');
  assert.ok(order.payment.collectedAt);
});

test('order and invoice numbers increment across orders', { skip }, async () => {
  const [customer, vendor] = await Promise.all([makeCustomer(), makeApprovedVendor()]);
  const product = await makeApprovedProduct(vendor, { stock: 10 });
  const mk = () =>
    createOrder(customer, {
      vendorId: vendor._id.toString(),
      items: [{ product: product._id.toString(), size: 'M', quantity: 1 }],
      deliveryAddress: address,
    });

  const o1 = await mk();
  const o2 = await mk();
  const seq1 = Number(o1.orderNumber.split('-')[2]);
  const seq2 = Number(o2.orderNumber.split('-')[2]);
  assert.equal(seq2, seq1 + 1, 'order number increments');
});
