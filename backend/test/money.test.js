import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  isValidPaise,
  rupeesToPaise,
  paiseToRupees,
  applyBps,
  formatPaise,
} from '../lib/money.js';

test('isValidPaise accepts non-negative integers only', () => {
  assert.equal(isValidPaise(0), true);
  assert.equal(isValidPaise(2500), true);
  assert.equal(isValidPaise(-1), false);
  assert.equal(isValidPaise(12.5), false);
  assert.equal(isValidPaise('2500'), false);
});

test('rupeesToPaise rounds half-up and accepts numeric strings', () => {
  assert.equal(rupeesToPaise(25), 2500);
  assert.equal(rupeesToPaise('49.99'), 4999);
  assert.equal(rupeesToPaise(0.005), 1); // half-up
});

test('rupeesToPaise throws on invalid input', () => {
  assert.throws(() => rupeesToPaise(-5));
  assert.throws(() => rupeesToPaise('abc'));
  assert.throws(() => rupeesToPaise(Infinity));
});

test('paiseToRupees is the inverse for whole rupees', () => {
  assert.equal(paiseToRupees(2500), 25);
  assert.equal(paiseToRupees(4999), 49.99);
});

test('applyBps computes tax with half-up rounding', () => {
  assert.equal(applyBps(10000, 500), 500); // 5% of ₹100
  assert.equal(applyBps(0, 500), 0);
  assert.equal(applyBps(10000, 0), 0);
  assert.equal(applyBps(333, 500), 17); // 16.65 -> 17
});

test('formatPaise renders Indian-grouped rupees with two subunit digits', () => {
  assert.equal(formatPaise(2500), '₹25.00');
  assert.equal(formatPaise(4999), '₹49.99');
  assert.equal(formatPaise(0), '₹0.00');
  assert.equal(formatPaise(100000000), '₹10,00,000.00');
});
