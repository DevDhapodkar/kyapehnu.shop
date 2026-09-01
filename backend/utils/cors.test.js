import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildCorsOptions, parseAllowedOrigins } from './cors.js';

/** Run the cors `origin` callback and return what it decided. */
const decide = (options, origin) => {
  let result;
  options.origin(origin, (err, allow) => {
    result = { err, allow };
  });
  return result;
};

test('a request with no Origin (native app, curl, same-origin) is allowed', () => {
  const opts = buildCorsOptions(['https://shop.kyapehnu.com']);
  assert.deepEqual(decide(opts, undefined), { err: null, allow: true });
});

test('an allow-listed origin is permitted', () => {
  const opts = buildCorsOptions(['https://shop.kyapehnu.com']);
  assert.deepEqual(decide(opts, 'https://shop.kyapehnu.com'), { err: null, allow: true });
});

test('an origin not on the list is denied without throwing', () => {
  const opts = buildCorsOptions(['https://shop.kyapehnu.com']);
  const { err, allow } = decide(opts, 'https://evil.example');
  assert.equal(err, null, 'denies by omitting headers, not by erroring into a 500');
  assert.equal(allow, false);
});

test('an empty allowlist still lets no-Origin requests through but blocks all cross-origin', () => {
  const opts = buildCorsOptions([]);
  assert.equal(decide(opts, undefined).allow, true);
  assert.equal(decide(opts, 'https://shop.kyapehnu.com').allow, false);
});

test('parseAllowedOrigins trims, splits and drops blanks', () => {
  assert.deepEqual(
    parseAllowedOrigins(' https://a.com , https://b.com ,,'),
    ['https://a.com', 'https://b.com']
  );
  assert.deepEqual(parseAllowedOrigins(undefined), []);
  assert.deepEqual(parseAllowedOrigins(''), []);
});
