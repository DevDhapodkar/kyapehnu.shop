// Public product reads must not leak unmoderated listings. GET /api/products/:id
// carries no auth, so it may only serve what the storefront feed serves —
// APPROVED and available. The enforcement lives in the query filter, so that
// is what these tests pin. Mongoose statics are stubbed; no database needed.
import { test, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

import Product from '../models/Product.js';
import { PRODUCT_STATUS } from '../utils/productStatus.js';
import { getProduct } from './productController.js';

const oid = () => new mongoose.Types.ObjectId();

/** A stand-in for a mongoose Query: chainable and awaitable. */
const query = (value) => {
  const q = { populate: () => q, then: (res, rej) => Promise.resolve(value).then(res, rej) };
  return q;
};

const mockRes = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.body = payload; return this; },
});

afterEach(() => mock.restoreAll());

test('the read is constrained to APPROVED and available listings', async () => {
  let filter;
  mock.method(Product, 'findOne', (f) => {
    filter = f;
    return query({ _id: f._id, name: 'Linen Shirt' });
  });

  const id = oid();
  const res = mockRes();
  await getProduct({ params: { id: String(id) } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(filter.status, PRODUCT_STATUS.APPROVED, 'only approved listings');
  assert.equal(filter.isAvailable, true, 'only available listings');
  assert.equal(String(filter._id), String(id));
});

test('a listing the filter excludes comes back as a 404, not leaked', async () => {
  // findOne returns null when status/availability do not match — same answer
  // a pending, rejected, hidden or missing product all give.
  mock.method(Product, 'findOne', () => query(null));
  const res = mockRes();
  await getProduct({ params: { id: String(oid()) } }, res);
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { message: 'Product not found' });
});

test('a malformed id answers 404 without touching the database', async () => {
  const findOne = mock.method(Product, 'findOne', () => query(null));
  const res = mockRes();
  await getProduct({ params: { id: 'not-an-object-id' } }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(findOne.mock.callCount(), 0);
});
