import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildStockUpdate } from './stock.js';

const line = { product: 'p1', size: 'M', quantity: 3 };

test('a reservation (-1) only matches a size row that still holds enough stock', () => {
  const { filter, update } = buildStockUpdate(line, -1);
  // $elemMatch with stock >= quantity is what makes the decrement atomic:
  // MongoDB applies the whole update to one document indivisibly, so two
  // concurrent reservations of the last units cannot both match.
  assert.deepEqual(filter, {
    _id: 'p1',
    sizes: { $elemMatch: { size: 'M', stock: { $gte: 3 } } },
  });
  assert.deepEqual(update, { $inc: { 'sizes.$.stock': -3 } });
});

test('a reservation can never drive stock below zero', () => {
  // The guard is stock >= quantity, so a row with less stock than requested
  // simply does not match — the decrement is skipped, not applied negative.
  const { filter } = buildStockUpdate({ ...line, quantity: 100 }, -1);
  assert.equal(filter.sizes.$elemMatch.stock.$gte, 100);
});

test('a restore (+1) applies unconditionally to the size row', () => {
  const { filter, update } = buildStockUpdate(line, 1);
  assert.deepEqual(filter, { _id: 'p1', 'sizes.size': 'M' });
  assert.deepEqual(update, { $inc: { 'sizes.$.stock': 3 } });
});

test('the increment matches the reserved quantity, restoring exactly what was taken', () => {
  const { update } = buildStockUpdate({ ...line, quantity: 5 }, 1);
  assert.equal(update.$inc['sizes.$.stock'], 5);
});

test('a non-numeric quantity is treated as zero rather than NaN', () => {
  const { update } = buildStockUpdate({ product: 'p1', size: 'M', quantity: undefined }, -1);
  assert.equal(update.$inc['sizes.$.stock'], -0);
});
