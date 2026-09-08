import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveProductImageUri, FALLBACK_PRODUCT_IMAGE } from './productImage.js';

test('resolveProductImageUri returns fallback on null or empty', () => {
  assert.equal(resolveProductImageUri(null), FALLBACK_PRODUCT_IMAGE);
  assert.equal(resolveProductImageUri(undefined), FALLBACK_PRODUCT_IMAGE);
  assert.equal(resolveProductImageUri(''), FALLBACK_PRODUCT_IMAGE);
  assert.equal(resolveProductImageUri('   '), FALLBACK_PRODUCT_IMAGE);
});

test('resolveProductImageUri intercepts Cloudinary sample.webp 404s', () => {
  assert.equal(
    resolveProductImageUri('https://res.cloudinary.com/kyapehnu/image/upload/v1788015186/kyapehnu/products/sample.webp'),
    FALLBACK_PRODUCT_IMAGE
  );
  assert.equal(
    resolveProductImageUri('http://example.com/images/sample.webp'),
    FALLBACK_PRODUCT_IMAGE
  );
});

test('resolveProductImageUri preserves valid image URIs', () => {
  const validUrl = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8';
  assert.equal(resolveProductImageUri(validUrl), validUrl);
});

test('resolveProductImageUri supports object with uri property', () => {
  assert.equal(
    resolveProductImageUri({ uri: 'https://res.cloudinary.com/kyapehnu/sample.webp' }),
    FALLBACK_PRODUCT_IMAGE
  );
  assert.equal(
    resolveProductImageUri({ uri: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8' }),
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8'
  );
});
