import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import { signParams } from '../services/imageStorage.js';

test('signParams matches Cloudinary spec: sha1 of sorted k=v joined + secret', () => {
  const params = { timestamp: 1700000000, folder: 'kyapehnu/vendors/abc' };
  const secret = 'test-secret';
  // Expected: sorted keys -> "folder=...&timestamp=..." + secret, sha1 hex.
  const expected = crypto
    .createHash('sha1')
    .update('folder=kyapehnu/vendors/abc&timestamp=1700000000' + secret)
    .digest('hex');
  assert.equal(signParams(params, secret), expected);
});

test('signParams sorts keys alphabetically regardless of input order', () => {
  const a = signParams({ timestamp: 1, folder: 'x' }, 's');
  const b = signParams({ folder: 'x', timestamp: 1 }, 's');
  assert.equal(a, b);
});

test('signParams drops empty/undefined params from the signature', () => {
  const withEmpty = signParams({ folder: 'x', timestamp: 1, eager: '' }, 's');
  const without = signParams({ folder: 'x', timestamp: 1 }, 's');
  assert.equal(withEmpty, without);
});

test('signParams changes when the secret changes (secret actually participates)', () => {
  assert.notEqual(signParams({ folder: 'x', timestamp: 1 }, 's1'), signParams({ folder: 'x', timestamp: 1 }, 's2'));
});
