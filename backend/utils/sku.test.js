import { test } from 'node:test';
import assert from 'node:assert/strict';

import { generateSku } from './sku.js';

test('generateSku prefixes by category and pads to 4 digits', () => {
  assert.equal(generateSku('WOMEN', () => 0), 'WM-1000');
  assert.equal(generateSku('MEN', () => 0.999999), 'MN-9999');
  assert.equal(generateSku('KIDS', () => 0.5), 'KD-5500');
});

test('generateSku falls back to KP for unknown categories', () => {
  assert.match(generateSku('UNKNOWN', () => 0.1), /^KP-\d{4}$/);
});

test('generateSku suffix stays within 1000-9999 across the range', () => {
  for (const r of [0, 0.25, 0.5, 0.75, 0.9999]) {
    const n = Number(generateSku('UNISEX', () => r).split('-')[1]);
    assert.ok(n >= 1000 && n <= 9999, `suffix ${n} out of range for r=${r}`);
  }
});
