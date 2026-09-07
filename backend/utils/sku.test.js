import { test } from 'node:test';
import assert from 'node:assert/strict';

import { generateSku, buildUniqueSku } from './sku.js';

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

test('buildUniqueSku returns the short form when it is free', async () => {
  const sku = await buildUniqueSku('WOMEN', () => false, { rng: () => 0 });
  assert.equal(sku, 'WM-1000');
});

test('buildUniqueSku skips taken candidates and returns a free one', async () => {
  let call = 0;
  // First candidate taken, second free. rng advances the suffix each try.
  const rngValues = [0, 0.5];
  const rng = () => rngValues[call];
  const exists = (sku) => {
    const taken = call === 0;
    call += 1;
    return sku === 'WM-1000' && taken;
  };
  const sku = await buildUniqueSku('WOMEN', exists, { rng });
  assert.equal(sku, 'WM-5500');
});

test('buildUniqueSku falls back to a timestamp form after max collisions', async () => {
  const sku = await buildUniqueSku('MEN', () => true, { maxTries: 3, rng: () => 0 });
  assert.match(sku, /^MN-[0-9A-Z]+$/);
  assert.notEqual(sku, 'MN-1000');
});
