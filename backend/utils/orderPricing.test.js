import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseCartLines, priceOrderLines, MAX_ITEMS_PER_ORDER, DELIVERY_FEE } from './orderPricing.js';

const VENDOR = 'v1';
const shirt = {
  _id: 'p1',
  vendor: VENDOR,
  name: 'Linen Shirt',
  price: 1499,
  status: 'APPROVED',
  isAvailable: true,
  sizes: [{ size: 'M', stock: 4 }, { size: 'L', stock: 0 }],
};

const line = (over = {}) => ({ product: 'p1', size: 'M', quantity: 1, ...over });

/* ------------------------------------------------------------ parsing -- */

test('parseCartLines keeps only product, size and quantity', () => {
  const [parsed] = parseCartLines([line({ price: 1, name: 'spoofed' })]);
  assert.deepEqual(parsed, { product: 'p1', size: 'M', quantity: 1 });
});

test('parseCartLines rejects an empty or non-array cart', () => {
  assert.throws(() => parseCartLines([]), { status: 400 });
  assert.throws(() => parseCartLines(undefined), { status: 400 });
  assert.throws(() => parseCartLines('p1'), { status: 400 });
});

test('parseCartLines rejects a line missing a product or size', () => {
  assert.throws(() => parseCartLines([line({ product: undefined })]), { status: 400 });
  assert.throws(() => parseCartLines([line({ size: '' })]), { status: 400 });
});

test('parseCartLines rejects non-positive, fractional and oversized quantities', () => {
  assert.throws(() => parseCartLines([line({ quantity: 0 })]), { status: 400 });
  assert.throws(() => parseCartLines([line({ quantity: -3 })]), { status: 400 });
  assert.throws(() => parseCartLines([line({ quantity: 1.5 })]), { status: 400 });
  assert.throws(() => parseCartLines([line({ quantity: 999 })]), { status: 400 });
});

test('parseCartLines caps the number of lines in one order', () => {
  const many = Array.from({ length: MAX_ITEMS_PER_ORDER + 1 }, () => line());
  assert.throws(() => parseCartLines(many), { status: 400 });
});

/* ------------------------------------------------------------ pricing -- */

test('priceOrderLines prices from the catalog, ignoring any client price', () => {
  const { items, subtotal, totalPrice } = priceOrderLines([line({ quantity: 2 })], [shirt], VENDOR);
  assert.equal(items[0].price, 1499);
  assert.equal(items[0].name, 'Linen Shirt');
  assert.equal(subtotal, 2998);
  assert.equal(totalPrice, 2998 + DELIVERY_FEE);
});

test("the delivery fee is the server's, added once per order", () => {
  const jacket = { ...shirt, _id: 'p2', name: 'Jacket', price: 500, sizes: [{ size: 'S', stock: 9 }] };
  const { deliveryFee, subtotal, totalPrice } = priceOrderLines(
    [line(), { product: 'p2', size: 'S', quantity: 1 }],
    [shirt, jacket],
    VENDOR
  );
  assert.equal(deliveryFee, DELIVERY_FEE);
  assert.equal(subtotal, 1999);
  assert.equal(totalPrice, 1999 + DELIVERY_FEE, 'one fee, not one per line');
});

test('a product with no sizes at all is accepted as a free-size line', () => {
  // The app sends size 'FREE' when a listing carries no size variants.
  const scarf = { ...shirt, _id: 'p3', name: 'Scarf', price: 300, sizes: [] };
  const { items, subtotal } = priceOrderLines(
    [{ product: 'p3', size: 'FREE', quantity: 2 }],
    [scarf],
    VENDOR
  );
  assert.equal(items[0].size, 'FREE');
  assert.equal(subtotal, 600);
});

test('a sized product still rejects a size it does not carry', () => {
  assert.throws(() => priceOrderLines([line({ size: 'FREE' })], [shirt], VENDOR), { status: 400 });
});

test('priceOrderLines sums every line into the total', () => {
  const jacket = { ...shirt, _id: 'p2', name: 'Jacket', price: 500, sizes: [{ size: 'S', stock: 9 }] };
  const { subtotal } = priceOrderLines(
    [line({ quantity: 2 }), { product: 'p2', size: 'S', quantity: 3 }],
    [shirt, jacket],
    VENDOR
  );
  assert.equal(subtotal, 2 * 1499 + 3 * 500);
});

test('priceOrderLines rejects a product from another vendor', () => {
  assert.throws(() => priceOrderLines([line()], [{ ...shirt, vendor: 'other' }], VENDOR), { status: 400 });
});

test('priceOrderLines rejects a product that is missing from the catalog', () => {
  assert.throws(() => priceOrderLines([line()], [], VENDOR), { status: 400 });
});

test('priceOrderLines rejects unapproved or unavailable products', () => {
  assert.throws(() => priceOrderLines([line()], [{ ...shirt, status: 'PENDING_QC' }], VENDOR), { status: 400 });
  assert.throws(() => priceOrderLines([line()], [{ ...shirt, isAvailable: false }], VENDOR), { status: 400 });
});

test('priceOrderLines rejects an unknown size and one that is out of stock', () => {
  assert.throws(() => priceOrderLines([line({ size: 'XXL' })], [shirt], VENDOR), { status: 400 });
  assert.throws(() => priceOrderLines([line({ size: 'L' })], [shirt], VENDOR), { status: 400 });
});

test('priceOrderLines rejects a quantity beyond the stock on hand', () => {
  assert.throws(() => priceOrderLines([line({ quantity: 5 })], [shirt], VENDOR), { status: 400 });
  assert.doesNotThrow(() => priceOrderLines([line({ quantity: 4 })], [shirt], VENDOR));
});

test('priceOrderLines sums duplicate lines of one size against the same stock', () => {
  assert.throws(
    () => priceOrderLines([line({ quantity: 3 }), line({ quantity: 3 })], [shirt], VENDOR),
    { status: 400 }
  );
});

test('priceOrderLines compares ids by value, not identity', () => {
  const objectIdish = { ...shirt, _id: { toString: () => 'p1' }, vendor: { toString: () => VENDOR } };
  const { subtotal } = priceOrderLines([line()], [objectIdish], { toString: () => VENDOR });
  assert.equal(subtotal, 1499);
});
