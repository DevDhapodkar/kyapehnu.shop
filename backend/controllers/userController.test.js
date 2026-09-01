// A server-side failure must not hand the client the underlying error detail.
// addAddress routes its 500 through serverError; this pins that a triggered
// failure returns only a clean message, no leaked internals. The same helper
// carries the contract across every controller.
import { test, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { addAddress } from './userController.js';

const mockRes = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.body = payload; return this; },
});

afterEach(() => mock.restoreAll());

test('a failed save returns a clean message with no error detail', async () => {
  mock.method(console, 'error', () => {}); // silence the expected server log
  const req = {
    body: { line1: '12 Sadar' },
    user: {
      savedAddresses: { push: () => {} },
      save: async () => {
        throw new Error('E11000 duplicate key error users.$phone_1 leaking schema');
      },
    },
  };
  const res = mockRes();
  await addAddress(req, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: 'Failed to add address' });
  assert.equal('error' in res.body, false, 'the Mongo detail must not reach the client');
});

test('a successful save returns the updated profile', async () => {
  const req = {
    body: { line1: '12 Sadar' },
    user: { savedAddresses: { push: () => {} }, save: async () => {} },
  };
  req.user.name = 'Aarti';
  const res = mockRes();
  await addAddress(req, res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.name, 'Aarti');
});
