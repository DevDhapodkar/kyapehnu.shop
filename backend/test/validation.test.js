import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createOrderSchema,
  updateProductSchema,
  createProductSchema,
  nearbyQuerySchema,
  updateLocationSchema,
} from '../validation/schemas.js';

test('updateProductSchema STRIPS injected privileged fields (mass-assignment guard)', () => {
  const parsed = updateProductSchema.parse({
    name: 'Kurta',
    vendor: 'ffffffffffffffffffffffff', // attempt to steal ownership
    status: 'APPROVED', // attempt to self-approve
    marginPaise: 999999, // attempt to zero the platform margin
    sellingPricePaise: 1,
  });
  assert.deepEqual(Object.keys(parsed), ['name']);
  assert.equal(parsed.vendor, undefined);
  assert.equal(parsed.status, undefined);
  assert.equal(parsed.marginPaise, undefined);
});

test('updateProductSchema rejects an empty patch', () => {
  assert.throws(() => updateProductSchema.parse({}));
});

test('createProductSchema requires a base price and at least one size', () => {
  assert.throws(() => createProductSchema.parse({ name: 'x', category: 'MEN' }));
  const ok = createProductSchema.parse({
    name: 'Shirt',
    category: 'MEN',
    basePriceRupees: 799,
    sizes: [{ size: 'M', stock: 4 }],
    junk: 'dropped',
  });
  assert.equal(ok.basePriceRupees, 799);
  assert.equal(ok.junk, undefined);
});

test('createOrderSchema enforces item shape and drops unknown keys', () => {
  const ok = createOrderSchema.parse({
    vendorId: 'a'.repeat(24),
    isAdmin: true, // dropped
    items: [{ product: 'b'.repeat(24), size: 'L', quantity: 2, price: 1 /* dropped */ }],
    deliveryAddress: {
      line1: '12 MG Road',
      pincode: '440001',
      location: { type: 'Point', coordinates: [79.08, 21.14] },
    },
  });
  assert.equal(ok.isAdmin, undefined);
  assert.equal(ok.paymentMethod, 'COD'); // defaulted
  assert.equal(ok.items[0].price, undefined);
  assert.equal(ok.items[0].quantity, 2);
});

test('createOrderSchema rejects a bad pincode and empty cart', () => {
  assert.throws(() =>
    createOrderSchema.parse({
      vendorId: 'a'.repeat(24),
      items: [],
      deliveryAddress: { line1: 'x', pincode: '12', location: { coordinates: [0, 0] } },
    })
  );
});

test('nearbyQuerySchema coerces strings and range-checks coordinates', () => {
  const ok = nearbyQuerySchema.parse({ lng: '79.08', lat: '21.14' });
  assert.equal(ok.lng, 79.08);
  assert.equal(ok.maxDistanceMeters, 5000);
  assert.throws(() => nearbyQuerySchema.parse({ lng: '200', lat: '21' })); // out of range
});

test('updateLocationSchema rejects non-numeric / out-of-range geo', () => {
  assert.throws(() => updateLocationSchema.parse({ lng: 'abc', lat: 10 }));
  assert.throws(() => updateLocationSchema.parse({ lng: 0, lat: 999 }));
  assert.deepEqual(updateLocationSchema.parse({ lng: '79', lat: '21' }), { lng: 79, lat: 21 });
});
