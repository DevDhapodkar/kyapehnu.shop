// Controller-level tests for the two things that were wrong on the wire: any
// signed-in user could read any order, and the client set its own prices.
// Mongoose statics are stubbed, so these run without a database.
import { test, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import axios from 'axios';

import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Vendor from '../models/Vendor.js';
import User from '../models/User.js';
import { getOrderById, createGuestOrder, cancelOrder } from './orderController.js';
import { DELIVERY_FEE } from '../utils/orderPricing.js';

const oid = () => new mongoose.Types.ObjectId();

/** A stand-in for a mongoose Query: chainable and awaitable. */
const query = (value) => {
  const q = {
    populate: () => q,
    select: () => q,
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  };
  return q;
};

/** Captures what the handler answered. */
const mockRes = () => {
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

afterEach(() => mock.restoreAll());

/* ------------------------------------------------- GET /api/orders/:id -- */

const BUYER_UID = 'firebase-buyer';
const VENDOR_UID = 'firebase-vendor';

const seedOrder = () => {
  const buyerId = oid();
  const vendorId = oid();
  const order = {
    _id: oid(),
    customer: { _id: buyerId, name: 'Aarti', phone: '+919812345678' },
    vendor: { _id: vendorId, shopName: 'Sadar Threads', whatsappNumber: '+919800000000' },
    totalPrice: 1499,
  };
  mock.method(Order, 'findById', () => query(order));
  return { order, buyerId, vendorId };
};

test('getOrderById hides an order from a signed-in stranger', async () => {
  const { order } = seedOrder();
  // A real account, just not a party to this order.
  mock.method(User, 'findOne', () => query({ _id: oid() }));
  mock.method(Vendor, 'findOne', () => query({ _id: oid() }));

  const res = mockRes();
  await getOrderById({ params: { id: String(order._id) }, firebaseUser: { uid: 'someone-else' } }, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { message: 'Order not found' });
});

test('getOrderById still serves the buyer who placed it', async () => {
  const { order, buyerId } = seedOrder();
  mock.method(User, 'findOne', () => query({ _id: buyerId }));
  mock.method(Vendor, 'findOne', () => query(null));

  const res = mockRes();
  await getOrderById({ params: { id: String(order._id) }, firebaseUser: { uid: BUYER_UID } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.totalPrice, 1499);
});

test('getOrderById still serves the shop fulfilling it', async () => {
  const { order, vendorId } = seedOrder();
  mock.method(User, 'findOne', () => query(null));
  mock.method(Vendor, 'findOne', () => query({ _id: vendorId }));

  const res = mockRes();
  await getOrderById({ params: { id: String(order._id) }, firebaseUser: { uid: VENDOR_UID } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.customer.phone, '+919812345678');
});

test('getOrderById answers a malformed id without a 500', async () => {
  const res = mockRes();
  await getOrderById({ params: { id: 'not-an-object-id' }, firebaseUser: { uid: BUYER_UID } }, res);
  assert.equal(res.statusCode, 404);
});

/* --------------------------------------------- POST /api/orders/guest -- */

const guestBody = (items, totalPrice) => ({
  body: {
    vendor: null, // filled in per test
    items,
    totalPrice,
    contact: { name: 'Aarti', phone: '+919812345678' },
    deliveryAddress: { line1: '12 Sadar', pincode: '440001', location: { coordinates: [79.08, 21.14] } },
  },
});

test('createGuestOrder ignores a client-supplied price and bills the catalog', async () => {
  const vendorId = oid();
  const productId = oid();

  mock.method(Vendor, 'findById', () => query({ _id: vendorId, shopName: 'Sadar Threads' }));
  mock.method(Product, 'find', () =>
    query([
      {
        _id: productId,
        vendor: vendorId,
        name: 'Linen Shirt',
        price: 1499,
        status: 'APPROVED',
        isAvailable: true,
        sizes: [{ size: 'M', stock: 5 }],
      },
    ])
  );
  mock.method(Product, 'updateOne', () => Promise.resolve({}));
  mock.method(axios, 'post', async () => ({ data: {} }));

  let created;
  mock.method(Order, 'create', async (doc) => {
    created = doc;
    return { ...doc, _id: oid() };
  });

  // The attacker's cart: a ₹1499 shirt, declared at ₹1.
  const req = guestBody([{ product: String(productId), size: 'M', quantity: 2, price: 1, name: 'x' }], 1);
  req.body.vendor = String(vendorId);

  const res = mockRes();
  await createGuestOrder(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(created.items[0].price, 1499, 'line price comes from the catalog');
  assert.equal(created.subtotal, 2998);
  assert.equal(created.deliveryFee, DELIVERY_FEE, 'the fee is the server\'s, not the cart\'s');
  assert.equal(created.totalPrice, 2998 + DELIVERY_FEE, 'total is recomputed, not accepted');
  assert.equal(res.body.totalPrice, 2998 + DELIVERY_FEE);
});

test('createGuestOrder accepts the payload shape the app actually sends', async () => {
  // customer-app/src/services/checkout.js maps a cart line to
  // { product, name, size, quantity, price } — and sends 'FREE' when the
  // listing carries no size variants. Both must go through.
  const vendorId = oid();
  const scarfId = oid();

  mock.method(Vendor, 'findById', () => query({ _id: vendorId }));
  mock.method(Product, 'find', () =>
    query([
      {
        _id: scarfId,
        vendor: vendorId,
        name: 'Silk Stole',
        price: 899,
        status: 'APPROVED',
        isAvailable: true,
        sizes: [],
      },
    ])
  );
  mock.method(Product, 'updateOne', () => Promise.resolve({}));
  mock.method(axios, 'post', async () => ({ data: {} }));

  let created;
  mock.method(Order, 'create', async (doc) => {
    created = doc;
    return { ...doc, _id: oid() };
  });

  const req = guestBody(
    [{ product: String(scarfId), name: 'Silk Stole', size: 'FREE', quantity: 1, price: 899 }],
    899 + DELIVERY_FEE
  );
  req.body.vendor = String(vendorId);

  const res = mockRes();
  await createGuestOrder(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(created.items[0].size, 'FREE');
  assert.equal(created.totalPrice, 899 + DELIVERY_FEE);
});

test('createGuestOrder refuses a quantity the shelf cannot cover', async () => {
  const vendorId = oid();
  const productId = oid();

  mock.method(Vendor, 'findById', () => query({ _id: vendorId }));
  mock.method(Product, 'find', () =>
    query([
      {
        _id: productId,
        vendor: vendorId,
        name: 'Linen Shirt',
        price: 1499,
        status: 'APPROVED',
        isAvailable: true,
        sizes: [{ size: 'M', stock: 1 }],
      },
    ])
  );
  const create = mock.method(Order, 'create', async (doc) => doc);

  const req = guestBody([{ product: String(productId), size: 'M', quantity: 4 }], 4);
  req.body.vendor = String(vendorId);

  const res = mockRes();
  await createGuestOrder(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /Only 1 left/);
  assert.equal(create.mock.callCount(), 0, 'no order is written');
});

test('createGuestOrder refuses an item from another shop', async () => {
  const vendorId = oid();
  const productId = oid();

  mock.method(Vendor, 'findById', () => query({ _id: vendorId }));
  mock.method(Product, 'find', () =>
    query([
      {
        _id: productId,
        vendor: oid(), // a different shop
        name: 'Linen Shirt',
        price: 1499,
        status: 'APPROVED',
        isAvailable: true,
        sizes: [{ size: 'M', stock: 5 }],
      },
    ])
  );
  const create = mock.method(Order, 'create', async (doc) => doc);

  const req = guestBody([{ product: String(productId), size: 'M', quantity: 1 }], 1499);
  req.body.vendor = String(vendorId);

  const res = mockRes();
  await createGuestOrder(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(create.mock.callCount(), 0);
});

test('createGuestOrder rejects an empty cart before touching the catalog', async () => {
  mock.method(Vendor, 'findById', () => query({ _id: oid() }));
  const find = mock.method(Product, 'find', () => query([]));

  const req = guestBody([], 0);
  req.body.vendor = String(oid());

  const res = mockRes();
  await createGuestOrder(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Your cart is empty');
  assert.equal(find.mock.callCount(), 0);
});

/* ------------------------------------- PATCH /api/orders/:id/cancel -- */

test('cancelOrder answers 403 on a guest order instead of crashing', async () => {
  // A guest order has no `customer` — this used to throw and surface as a 500.
  mock.method(Order, 'findById', () => query({ _id: oid(), customer: undefined, status: 'PENDING', items: [] }));

  const res = mockRes();
  await cancelOrder({ params: { id: String(oid()) }, user: { _id: oid() }, body: {} }, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { message: 'This is not your order' });
});
