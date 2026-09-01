// Behavioural: mount a limiter on a real Express app and prove it blocks past
// its cap. The library's default store is in-memory, so this runs in-process.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import rateLimit from 'express-rate-limit';

import { limiterOptions } from './rateLimit.js';

let server;
let baseUrl;

before(async () => {
  const app = express();
  // A tiny 3-per-window limiter so the test is fast and deterministic.
  app.use('/guarded', rateLimit(limiterOptions({ windowMs: 60_000, max: 3, message: 'slow down' })));
  app.get('/guarded', (req, res) => res.json({ ok: true }));

  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  baseUrl = `http://127.0.0.1:${server.address().port}/guarded`;
});

after(() => server?.close());

test('requests up to the cap pass, the next is blocked with 429', async () => {
  const statuses = [];
  for (let i = 0; i < 4; i++) {
    const res = await fetch(baseUrl);
    statuses.push(res.status);
  }
  assert.deepEqual(statuses.slice(0, 3), [200, 200, 200], 'first three allowed');
  assert.equal(statuses[3], 429, 'fourth over the cap is rejected');
});

test('the 429 body carries the configured message, not a stack', async () => {
  // The window from the previous test is still open, so this is immediately limited.
  const res = await fetch(baseUrl);
  assert.equal(res.status, 429);
  const body = await res.json();
  assert.deepEqual(body, { message: 'slow down' });
});

test('limiterOptions sets standard headers and hides legacy ones', () => {
  const opts = limiterOptions({ windowMs: 1000, max: 5, message: 'x' });
  assert.equal(opts.standardHeaders, true);
  assert.equal(opts.legacyHeaders, false);
  assert.equal(opts.max, 5);
  assert.deepEqual(opts.message, { message: 'x' });
});
