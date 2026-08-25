import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_REQUEST,
  isAllowedMime,
  buildProductFolder,
  buildTransformedUrl,
  buildThumbnails,
  IMAGE_TRANSFORMS,
} from './imageValidation.js';

test('isAllowedMime accepts supported image types, case-insensitively', () => {
  assert.equal(isAllowedMime('image/jpeg'), true);
  assert.equal(isAllowedMime('IMAGE/PNG'), true);
  assert.equal(isAllowedMime('image/webp'), true);
  assert.equal(isAllowedMime('image/heic'), true);
});

test('isAllowedMime rejects non-image, missing, and non-string types', () => {
  assert.equal(isAllowedMime('application/pdf'), false);
  assert.equal(isAllowedMime('image/gif'), false);
  assert.equal(isAllowedMime(''), false);
  assert.equal(isAllowedMime(undefined), false);
  assert.equal(isAllowedMime(null), false);
  assert.equal(isAllowedMime(123), false);
});

test('buildProductFolder namespaces uploads by vendor id', () => {
  assert.equal(buildProductFolder('abc123'), 'kyapehnu/products/abc123');
});

test('buildTransformedUrl injects the transform right after /upload/', () => {
  const url =
    'https://res.cloudinary.com/demo/image/upload/v1699999999/kyapehnu/products/v1/abc.webp';
  assert.equal(
    buildTransformedUrl(url, IMAGE_TRANSFORMS.card),
    'https://res.cloudinary.com/demo/image/upload/c_limit,w_600,h_800,f_webp,q_auto/v1699999999/kyapehnu/products/v1/abc.webp'
  );
});

test('buildTransformedUrl returns the input when it is not a Cloudinary URL', () => {
  assert.equal(buildTransformedUrl('https://example.com/x.jpg', IMAGE_TRANSFORMS.card), 'https://example.com/x.jpg');
  assert.equal(buildTransformedUrl('', IMAGE_TRANSFORMS.card), '');
  assert.equal(buildTransformedUrl(undefined, IMAGE_TRANSFORMS.card), undefined);
});

test('buildThumbnails produces full, card, and thumb variants', () => {
  const url = 'https://res.cloudinary.com/demo/image/upload/v1/kyapehnu/products/v1/abc.webp';
  const thumbs = buildThumbnails(url);
  assert.ok(thumbs.full.includes('w_1200,h_1600'));
  assert.ok(thumbs.card.includes('w_600,h_800'));
  assert.ok(thumbs.thumb.includes('w_200,h_267'));
});

test('caps match the documented media-pipeline limits', () => {
  assert.equal(MAX_IMAGE_BYTES, 8 * 1024 * 1024);
  assert.equal(MAX_IMAGES_PER_REQUEST, 5);
});
