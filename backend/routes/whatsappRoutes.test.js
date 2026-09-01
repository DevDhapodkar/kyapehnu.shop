// End-to-end over a real Express app: the raw-body capture in server.js and the
// signature check in the controller only work together, so they are tested
// together. No database is touched by this route.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';

const APP_SECRET = 'test-app-secret';
const VERIFY_TOKEN = 'test-verify-token';

let baseUrl;
let server;

before(async () => {
  process.env.META_APP_SECRET = APP_SECRET;
  process.env.META_WEBHOOK_VERIFY_TOKEN = VERIFY_TOKEN;

  const { default: whatsappRoutes } = await import('./whatsappRoutes.js');

  const app = express();
  // Mirrors server.js.
  app.use(express.json({ limit: '1mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
  app.use('/api/whatsapp', whatsappRoutes);

  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/whatsapp/webhook`;
});

after(() => server?.close());

const post = (payload, { signature, secret = APP_SECRET } = {}) => {
  const body = JSON.stringify(payload);
  const sig =
    signature === undefined
      ? `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`
      : signature;

  return fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(sig === null ? {} : { 'X-Hub-Signature-256': sig }),
    },
    body,
  });
};

const delivery = { object: 'whatsapp_business_account', entry: [] };

test('a correctly signed delivery is accepted', async () => {
  const res = await post(delivery);
  assert.equal(res.status, 200);
});

test('an unsigned POST from a stranger is rejected', async () => {
  const res = await post(delivery, { signature: null });
  assert.equal(res.status, 401);
});

test('a POST signed with the wrong secret is rejected', async () => {
  const res = await post(delivery, { secret: 'wrong-secret' });
  assert.equal(res.status, 401);
});

test('a body altered after signing is rejected', async () => {
  const signed = JSON.stringify(delivery);
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Hub-Signature-256': `sha256=${crypto.createHmac('sha256', APP_SECRET).update(signed).digest('hex')}`,
    },
    body: JSON.stringify({ ...delivery, entry: [{ injected: true }] }),
  });
  assert.equal(res.status, 401);
});

test('a signed delivery for another product is still a 404', async () => {
  const res = await post({ object: 'instagram' });
  assert.equal(res.status, 404);
});

test('the GET verification handshake echoes the challenge for the right token', async () => {
  const ok = await fetch(
    `${baseUrl}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=12345`
  );
  assert.equal(ok.status, 200);
  assert.equal(await ok.text(), '12345');

  const bad = await fetch(
    `${baseUrl}?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=12345`
  );
  assert.equal(bad.status, 403);
});
