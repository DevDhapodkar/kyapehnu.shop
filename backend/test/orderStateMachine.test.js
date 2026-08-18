import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  assertTransition,
  canTransition,
  isTerminal,
  shouldRestock,
  nextStates,
  ORDER_STATUS,
} from '../services/orderStateMachine.js';

test('vendor can accept a pending order', () => {
  assert.doesNotThrow(() =>
    assertTransition(ORDER_STATUS.PENDING, ORDER_STATUS.ACCEPTED, 'VENDOR')
  );
});

test('vendor CANNOT skip straight to DELIVERED (the fraud gap)', () => {
  assert.throws(
    () => assertTransition(ORDER_STATUS.PENDING, ORDER_STATUS.DELIVERED, 'VENDOR'),
    /Illegal transition/
  );
});

test('a delivered order cannot be moved back', () => {
  assert.throws(
    () => assertTransition(ORDER_STATUS.DELIVERED, ORDER_STATUS.PENDING, 'ADMIN'),
    (err) => err.code === 'ILLEGAL_TRANSITION'
  );
});

test('customer may cancel only while PENDING', () => {
  assert.ok(canTransition(ORDER_STATUS.PENDING, ORDER_STATUS.CANCELLED, 'CUSTOMER'));
  assert.equal(
    canTransition(ORDER_STATUS.ACCEPTED, ORDER_STATUS.CANCELLED, 'CUSTOMER'),
    false
  );
});

test('admin can force-cancel mid-flight', () => {
  assert.ok(canTransition(ORDER_STATUS.READY_FOR_PICKUP, ORDER_STATUS.CANCELLED, 'ADMIN'));
});

test('same-state transition is a no-op error', () => {
  assert.throws(
    () => assertTransition(ORDER_STATUS.PENDING, ORDER_STATUS.PENDING, 'VENDOR'),
    (err) => err.code === 'NO_OP_TRANSITION'
  );
});

test('terminal + restock predicates', () => {
  assert.ok(isTerminal(ORDER_STATUS.DELIVERED));
  assert.ok(isTerminal(ORDER_STATUS.CANCELLED));
  assert.equal(isTerminal(ORDER_STATUS.PENDING), false);
  assert.ok(shouldRestock(ORDER_STATUS.CANCELLED));
  assert.ok(shouldRestock(ORDER_STATUS.REJECTED));
  assert.equal(shouldRestock(ORDER_STATUS.DELIVERED), false);
});

test('nextStates lists legal edges', () => {
  assert.deepEqual(nextStates(ORDER_STATUS.PENDING).sort(), [
    'ACCEPTED',
    'CANCELLED',
    'REJECTED',
  ]);
  assert.deepEqual(nextStates(ORDER_STATUS.DELIVERED), []);
});
