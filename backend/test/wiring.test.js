import { test } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Boot smoke test: importing the server wires up every route, controller,
 * model, and the admin portal. It must not throw and must not open a listener
 * under NODE_ENV=test. Catches syntax/import/registration errors across the
 * whole backend in one cheap check (no DB connection is made).
 */
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kyapehnu-test';
process.env.ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'test-secret';

test('the Express app imports and mounts without throwing', async () => {
  const mod = await import('../server.js');
  const app = mod.default;
  assert.equal(typeof app, 'function'); // express() app is callable
  assert.equal(typeof app.use, 'function');
  assert.equal(typeof app.handle, 'function'); // has a request handler wired
});

test('env loader flags COD-only while payments are disabled', async () => {
  const { loadEnv } = await import('../config/env.js');
  const env = loadEnv();
  assert.equal(env.features.payments, false);
  assert.equal(env.features.codOnly, true);
  assert.equal(env.features.porter, false);
});
