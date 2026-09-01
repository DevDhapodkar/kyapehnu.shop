// Proves the limiter is actually mounted on the public tracking route, not just
// that a limiter can block in the abstract. GET /api/orders/track answers 400
// ("orderId and phone are required") before touching the database, so under-cap
// requests return 400 and requests past the cap return 429 — no DB needed.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

import orderRoutes from './orderRoutes.js';
import { AUTH_LIMIT } from '../middleware/rateLimit.js';

let server;
let baseUrl;

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/orders', orderRoutes);
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/orders/track`;
});

after(() => server?.close());

test('the tracking route is rate-limited past its cap', async () => {
  const statuses = [];
  // Fire one past the auth cap. Missing params → 400 while under the cap.
  for (let i = 0; i < AUTH_LIMIT.max + 1; i++) {
    const res = await fetch(baseUrl);
    statuses.push(res.status);
  }
  assert.ok(
    statuses.slice(0, AUTH_LIMIT.max).every((s) => s === 400),
    'requests under the cap reach the handler (400 for missing params)'
  );
  assert.equal(statuses[AUTH_LIMIT.max], 429, 'the request past the cap is throttled');
});
