// The public discovery feed (GET /api/vendors/nearby, no auth) must expose only
// shop display fields — never the owner's phone/email, the firebaseUid, or the
// FCM pushTokens. It must also reject non-numeric coordinates rather than
// building a $near query with NaN. Mongoose statics are stubbed.
import { test, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import Vendor from '../models/Vendor.js';
import { listNearby, PUBLIC_VENDOR_FIELDS } from './vendorController.js';

const mockRes = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.body = payload; return this; },
});

/** Chainable Query stub that records the .select() projection. */
const queryCapturing = (captured, value) => {
  const q = {
    select(fields) { captured.projection = fields; return q; },
    then(res, rej) { return Promise.resolve(value).then(res, rej); },
  };
  return q;
};

afterEach(() => mock.restoreAll());

test('the response is projected to safe display fields only', async () => {
  const captured = {};
  let filter;
  mock.method(Vendor, 'find', (f) => {
    filter = f;
    return queryCapturing(captured, [{ shopName: 'Sadar Threads' }]);
  });

  const res = mockRes();
  await listNearby({ query: { lng: '79.08', lat: '21.14' } }, res);

  assert.equal(res.statusCode, 200);
  assert.ok(captured.projection, 'a projection is applied');
  // The sensitive fields must not be selected.
  for (const leaked of ['phone', 'email', 'whatsappNumber', 'firebaseUid', 'pushTokens', 'ownerName']) {
    assert.ok(!captured.projection.includes(leaked), `projection must not include ${leaked}`);
  }
  // The display fields the feed needs must be present.
  assert.ok(captured.projection.includes('shopName'));
  assert.ok(captured.projection.includes('location'));
  // The exported allowlist is what is used.
  assert.equal(captured.projection, PUBLIC_VENDOR_FIELDS);
  // And the geo filter still only surfaces live, approved shops.
  assert.equal(filter.isActive, true);
  assert.equal(filter.approvalStatus, 'APPROVED');
});

test('missing coordinates are rejected with 400, not run as a NaN query', async () => {
  const find = mock.method(Vendor, 'find', () => queryCapturing({}, []));
  const res = mockRes();
  await listNearby({ query: {} }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(find.mock.callCount(), 0, 'no query is built from NaN coordinates');
});

test('non-numeric coordinates are rejected with 400', async () => {
  const find = mock.method(Vendor, 'find', () => queryCapturing({}, []));
  const res = mockRes();
  await listNearby({ query: { lng: 'abc', lat: 'xyz' } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(find.mock.callCount(), 0);
});
