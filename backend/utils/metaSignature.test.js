import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import { verifyMetaSignature } from './metaSignature.js';

const SECRET = 'app-secret';
const body = Buffer.from(JSON.stringify({ object: 'whatsapp_business_account' }));
const sign = (buf, secret = SECRET) =>
  `sha256=${crypto.createHmac('sha256', secret).update(buf).digest('hex')}`;

test('a signature produced with the app secret verifies', () => {
  assert.equal(verifyMetaSignature(body, sign(body), SECRET), true);
});

test('a signature from a different secret is rejected', () => {
  assert.equal(verifyMetaSignature(body, sign(body, 'not-the-secret'), SECRET), false);
});

test('a signature over different bytes is rejected', () => {
  assert.equal(verifyMetaSignature(Buffer.from('{"object":"tampered"}'), sign(body), SECRET), false);
});

test('a missing, malformed or wrong-algorithm header is rejected', () => {
  assert.equal(verifyMetaSignature(body, undefined, SECRET), false);
  assert.equal(verifyMetaSignature(body, '', SECRET), false);
  assert.equal(verifyMetaSignature(body, 'deadbeef', SECRET), false);
  assert.equal(verifyMetaSignature(body, 'sha1=deadbeef', SECRET), false);
  assert.equal(verifyMetaSignature(body, 'sha256=not-hex-at-all', SECRET), false);
});

test('a truncated digest of the right prefix is rejected, not partially matched', () => {
  const full = sign(body).slice('sha256='.length);
  assert.equal(verifyMetaSignature(body, `sha256=${full.slice(0, 32)}`, SECRET), false);
});

test('an absent body or secret is rejected rather than trusted', () => {
  assert.equal(verifyMetaSignature(undefined, sign(body), SECRET), false);
  assert.equal(verifyMetaSignature(body, sign(body), ''), false);
  assert.equal(verifyMetaSignature(body, sign(body), undefined), false);
});

test('verification is case-insensitive on the hex digest', () => {
  assert.equal(verifyMetaSignature(body, sign(body).toUpperCase().replace('SHA256', 'sha256'), SECRET), true);
});
