import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  PRODUCT_STATUS,
  requiresRequalification,
  statusForReview,
} from './productStatus.js';

test('content edits require re-qualification', () => {
  assert.equal(requiresRequalification({ name: 'New name' }), true);
  assert.equal(requiresRequalification({ images: ['a.webp'] }), true);
  assert.equal(requiresRequalification({ description: 'x', colors: ['red'] }), true);
});

test('stock and availability edits stay live', () => {
  assert.equal(requiresRequalification({ sizes: [{ size: 'M', stock: 3 }] }), false);
  assert.equal(requiresRequalification({ isAvailable: false }), false);
});

test('price change only re-qualifies past a 20% swing', () => {
  assert.equal(requiresRequalification({ price: 105 }, { price: 100 }), false); // +5%
  assert.equal(requiresRequalification({ price: 130 }, { price: 100 }), true); // +30%
  assert.equal(requiresRequalification({ price: 70 }, { price: 100 }), true); // -30%
});

test('statusForReview maps decisions and rejects unknowns', () => {
  assert.equal(statusForReview('APPROVE'), PRODUCT_STATUS.APPROVED);
  assert.equal(statusForReview('REJECT'), PRODUCT_STATUS.REJECTED);
  assert.throws(() => statusForReview('MAYBE'), /Unknown review decision/);
});
