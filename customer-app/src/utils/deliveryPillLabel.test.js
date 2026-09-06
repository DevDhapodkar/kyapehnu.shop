import test from 'node:test';
import assert from 'node:assert/strict';
import { getDeliveryPillLabel, getUserInitials } from './deliveryPillLabel.js';

test('prefers saved address locality over GPS', () => {
  assert.equal(
    getDeliveryPillLabel({
      savedAddresses: [{ line2: 'Dharampeth', city: 'Nagpur', line1: '12 Palm Rd' }],
      gpsLabel: 'Sitabuldi, Nagpur',
      gpsStatus: 'granted',
    }),
    'Dharampeth'
  );
});

test('uses line1 snippet when locality missing', () => {
  assert.equal(
    getDeliveryPillLabel({
      savedAddresses: [{ line1: 'Flat 4, West High Court Road', city: 'Nagpur' }],
    }),
    'Flat 4, West High Court Road'
  );
});

test('prompts to set address when none saved — never invents Sitabuldi', () => {
  assert.equal(
    getDeliveryPillLabel({
      savedAddresses: [],
      gpsLabel: 'Sitabuldi, Nagpur',
      gpsStatus: 'denied',
    }),
    'Set delivery address'
  );
  assert.equal(getDeliveryPillLabel({}), 'Set delivery address');
});

test('getUserInitials from name or email', () => {
  assert.equal(getUserInitials({ name: 'Dev Dhapodkar' }), 'DD');
  assert.equal(getUserInitials({ email: 'dev@example.com' }), 'D');
  assert.equal(getUserInitials({}), '');
});
