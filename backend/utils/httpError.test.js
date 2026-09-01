import { test, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { serverError } from './httpError.js';

const mockRes = () => ({
  statusCode: undefined,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.body = payload; return this; },
});

afterEach(() => mock.restoreAll());

test('the client gets only the message, never the underlying error', () => {
  mock.method(console, 'error', () => {});
  const res = mockRes();
  serverError(res, 'Failed to load orders', new Error('E11000 duplicate key on users.email_1'));
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: 'Failed to load orders' });
  assert.equal('error' in res.body, false, 'no error field leaks to the client');
});

test('the underlying detail is logged server-side for diagnosis', () => {
  const logged = [];
  mock.method(console, 'error', (...args) => logged.push(args));
  serverError(mockRes(), 'Failed to load orders', new Error('secret internal detail'));
  assert.equal(logged.length, 1);
  assert.match(logged[0].join(' '), /secret internal detail/);
});

test('the status defaults to 500 but is overridable (e.g. 502 upstream)', () => {
  mock.method(console, 'error', () => {});
  const res = mockRes();
  serverError(res, 'Image upload failed', new Error('cloudinary 500'), 502);
  assert.equal(res.statusCode, 502);
});

test('a non-Error value is logged without throwing', () => {
  mock.method(console, 'error', () => {});
  const res = mockRes();
  serverError(res, 'Something failed', 'a plain string');
  assert.deepEqual(res.body, { message: 'Something failed' });
});
