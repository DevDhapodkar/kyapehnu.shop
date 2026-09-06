import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveStorefrontLoadResult } from './storefrontLoad.js';

test('live items win — no mock injection', () => {
  const result = resolveStorefrontLoadResult({
    items: [{ _id: '1', name: 'Saree' }],
  });
  assert.equal(result.ok, true);
  assert.equal(result.products.length, 1);
  assert.equal(result.source, 'api');
});

test('empty API returns empty catalogue — never mock', () => {
  const result = resolveStorefrontLoadResult({ items: [] });
  assert.equal(result.ok, true);
  assert.deepEqual(result.products, []);
  assert.equal(result.source, 'api');
});

test('fetch error surfaces error — never mock', () => {
  const result = resolveStorefrontLoadResult({
    error: new Error('network down'),
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.products, []);
  assert.match(result.error, /network/i);
});
