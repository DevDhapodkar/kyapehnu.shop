import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ORDER_STATUS,
  ORDER_TIMELINE,
  canTransition,
  appendHistory,
  CUSTOMER_CANCELLABLE,
} from './orderStatus.js';

test('happy-path transitions are allowed in order', () => {
  assert.equal(canTransition('PENDING', 'ACCEPTED'), true);
  assert.equal(canTransition('ACCEPTED', 'PACKED'), true);
  assert.equal(canTransition('PACKED', 'READY_FOR_PICKUP'), true);
  assert.equal(canTransition('READY_FOR_PICKUP', 'IN_TRANSIT'), true);
  assert.equal(canTransition('IN_TRANSIT', 'DELIVERED'), true);
});

test('skipping a step or moving backwards is rejected', () => {
  assert.equal(canTransition('PENDING', 'PACKED'), false);
  assert.equal(canTransition('PENDING', 'DELIVERED'), false);
  assert.equal(canTransition('ACCEPTED', 'PENDING'), false);
  assert.equal(canTransition('DELIVERED', 'IN_TRANSIT'), false);
});

test('cancellation is allowed before pickup, not after', () => {
  assert.equal(canTransition('PENDING', 'CANCELLED'), true);
  assert.equal(canTransition('ACCEPTED', 'CANCELLED'), true);
  assert.equal(canTransition('PACKED', 'CANCELLED'), true);
  assert.equal(canTransition('READY_FOR_PICKUP', 'CANCELLED'), false);
  assert.equal(canTransition('IN_TRANSIT', 'CANCELLED'), false);
});

test('terminal states allow no transitions', () => {
  assert.deepEqual([canTransition('DELIVERED', 'PENDING'), canTransition('CANCELLED', 'PENDING')], [false, false]);
});

test('customers may only cancel before the shop packs', () => {
  assert.deepEqual(CUSTOMER_CANCELLABLE, [ORDER_STATUS.PENDING, ORDER_STATUS.ACCEPTED]);
});

test('the timeline is the happy path in order', () => {
  assert.deepEqual(ORDER_TIMELINE, [
    'PENDING',
    'ACCEPTED',
    'PACKED',
    'READY_FOR_PICKUP',
    'IN_TRANSIT',
    'DELIVERED',
  ]);
});

test('appendHistory is immutable and stamps the status', () => {
  const first = appendHistory([], 'PENDING', 'placed');
  const second = appendHistory(first, 'ACCEPTED');
  assert.equal(first.length, 1);
  assert.equal(second.length, 2);
  assert.equal(second[1].status, 'ACCEPTED');
  assert.ok(second[1].at instanceof Date);
});
