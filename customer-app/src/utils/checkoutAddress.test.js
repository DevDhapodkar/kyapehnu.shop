import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isPlaceholderPhone,
  buildCheckoutAddressFromSaved,
  buildCheckoutAddressFromForm,
} from './checkoutAddress.js';

test('detects invented placeholder phones', () => {
  assert.equal(isPlaceholderPhone('+91 99999 99999'), true);
  assert.equal(isPlaceholderPhone('9999999999'), true);
  assert.equal(isPlaceholderPhone('+91 98765 43210'), false);
});

test('saved address without phone fails hard — no 99999 invent', () => {
  const result = buildCheckoutAddressFromSaved({
    address: {
      line1: '12 Palm Rd',
      city: 'Nagpur',
      pincode: '440010',
      location: { type: 'Point', coordinates: [79.06, 21.14] },
    },
    profile: { name: 'Dev' },
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /phone|mobile/i);
});

test('saved address without coords fails hard — no Nagpur center invent', () => {
  const result = buildCheckoutAddressFromSaved({
    address: {
      line1: '12 Palm Rd',
      pincode: '440010',
      receiverName: 'Dev',
      receiverPhone: '9876543210',
    },
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /pin|map|location|coord/i);
});

test('saved address with complete fields succeeds', () => {
  const result = buildCheckoutAddressFromSaved({
    address: {
      label: 'HOME',
      line1: '12 Palm Rd',
      line2: 'Dharampeth',
      city: 'Nagpur',
      pincode: '440010',
      receiverName: 'Dev',
      receiverPhone: '9876543210',
      location: { type: 'Point', coordinates: [79.06, 21.14] },
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.address.pincode, '440010');
  assert.equal(result.address.receiverPhone, '9876543210');
});

test('form address requires explicit pincode — no 440001 invent', () => {
  const result = buildCheckoutAddressFromForm({
    flatNo: '4',
    streetArea: 'West High Court',
    detectedArea: 'Dharampeth',
    pincode: '',
    receiverName: 'Dev',
    phone: '9876543210',
    coords: [79.06, 21.14],
    addressType: 'HOME',
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /pincode|pin code/i);
});
