// Meta signs every Cloud API webhook delivery with an HMAC of the raw request
// body under the app secret, sent as `X-Hub-Signature-256: sha256=<hex>`.
// Without checking it, /api/whatsapp/webhook is a public endpoint that anyone
// on the internet can post arbitrary "vendor messages" to — which matters the
// moment it starts routing inventory commands.

import crypto from 'node:crypto';

const PREFIX = 'sha256=';

/**
 * Constant-time compare of two hex digests of equal length.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
const digestsMatch = (a, b) => {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  // timingSafeEqual throws on a length mismatch, so screen for it first —
  // length alone leaks nothing an attacker does not already control.
  if (left.length === 0 || left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};

/**
 * Did this body really come from Meta?
 * @param {Buffer | undefined} rawBody The exact bytes received, pre-JSON.parse
 * @param {string | undefined} header The X-Hub-Signature-256 header
 * @param {string | undefined} appSecret META_APP_SECRET
 * @returns {boolean}
 */
export const verifyMetaSignature = (rawBody, header, appSecret) => {
  if (!Buffer.isBuffer(rawBody) || !appSecret || typeof header !== 'string') return false;
  if (!header.startsWith(PREFIX)) return false;

  const received = header.slice(PREFIX.length).toLowerCase();
  // Non-hex would be decoded leniently by Buffer.from, silently shortening the
  // digest — reject it outright instead.
  if (!/^[0-9a-f]+$/.test(received)) return false;

  const expected = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  return digestsMatch(received, expected);
};
