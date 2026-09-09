import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateDistanceKm,
  isWithinNagpurBounds,
  isValidNagpurCity,
  isValidNagpurPincode,
  checkServiceability,
  NAGPUR_CENTER,
} from './porterServiceability.js';

test('porterServiceability: Haversine distance calculation', () => {
  // Sitabuldi to Dharampeth ~2.5km
  const dist = calculateDistanceKm(21.1458, 79.0882, 21.1396, 79.0645);
  assert.ok(dist >= 1.5 && dist <= 3.5, `Expected ~2.5km, got ${dist}`);

  // Same coordinates = 0
  assert.equal(calculateDistanceKm(21.1458, 79.0882, 21.1458, 79.0882), 0);
});

test('porterServiceability: isWithinNagpurBounds', () => {
  // Sitabuldi (Center)
  assert.equal(isWithinNagpurBounds(21.1458, 79.0882), true);
  // Dharampeth
  assert.equal(isWithinNagpurBounds(21.1400, 79.0600), true);
  // Butibori
  assert.equal(isWithinNagpurBounds(20.9800, 79.0000), true);
  // Mumbai coordinates (should fail)
  assert.equal(isWithinNagpurBounds(19.0760, 72.8777), false);
  // Delhi coordinates (should fail)
  assert.equal(isWithinNagpurBounds(28.6139, 77.2090), false);
});

test('porterServiceability: isValidNagpurCity', () => {
  assert.equal(isValidNagpurCity('Nagpur'), true);
  assert.equal(isValidNagpurCity('nagpur'), true);
  assert.equal(isValidNagpurCity(' Nagpur '), true);
  assert.equal(isValidNagpurCity('Nagpur, Maharashtra'), true);

  // Other cities must be rejected
  assert.equal(isValidNagpurCity('Mumbai'), false);
  assert.equal(isValidNagpurCity('Pune'), false);
  assert.equal(isValidNagpurCity('Delhi'), false);
  assert.equal(isValidNagpurCity('Bengaluru'), false);
});

test('porterServiceability: isValidNagpurPincode', () => {
  // Urban Nagpur (440001 - 440037)
  assert.equal(isValidNagpurPincode('440001'), true);
  assert.equal(isValidNagpurPincode('440010'), true);
  assert.equal(isValidNagpurPincode('440012'), true);
  assert.equal(isValidNagpurPincode('440024'), true);
  assert.equal(isValidNagpurPincode('440036'), true);

  // Peri-urban / Industrial Nagpur corridors (441xxx)
  assert.equal(isValidNagpurPincode('441110'), true); // Hingna
  assert.equal(isValidNagpurPincode('441108'), true); // Butibori
  assert.equal(isValidNagpurPincode('441001'), true); // Kamptee

  // Non-Nagpur pincodes
  assert.equal(isValidNagpurPincode('400001'), false); // Mumbai
  assert.equal(isValidNagpurPincode('411001'), false); // Pune
  assert.equal(isValidNagpurPincode('110001'), false); // Delhi
  assert.equal(isValidNagpurPincode('560001'), false); // Bangalore
  assert.equal(isValidNagpurPincode('12345'), false);
  assert.equal(isValidNagpurPincode(''), false);
});

test('porterServiceability: checkServiceability end-to-end', async () => {
  // 1. Valid Nagpur address (Sitabuldi pickup, Dharampeth drop)
  const validRes = await checkServiceability({
    pickup: { lat: 21.1458, lng: 79.0882 },
    drop: { lat: 21.1396, lng: 79.0645 },
    pincode: '440010',
    city: 'Nagpur',
  });
  assert.equal(validRes.serviceable, true);
  assert.ok(validRes.distanceKm > 0 && validRes.distanceKm < 10);

  // 2. Reject non-Nagpur city
  const wrongCity = await checkServiceability({
    drop: { lat: 19.0760, lng: 72.8777 },
    pincode: '400001',
    city: 'Mumbai',
  });
  assert.equal(wrongCity.serviceable, false);
  assert.match(wrongCity.reason, /Nagpur/);

  // 3. Reject invalid pincode
  const wrongPin = await checkServiceability({
    drop: { lat: 21.1458, lng: 79.0882 },
    pincode: '411001', // Pune
    city: 'Nagpur',
  });
  assert.equal(wrongPin.serviceable, false);
  assert.match(wrongPin.reason, /pincode/i);

  // 4. Reject coordinates outside 25km radius (e.g. Wardha ~75km away)
  const farCoords = await checkServiceability({
    pickup: { lat: 21.1458, lng: 79.0882 },
    drop: { lat: 20.7453, lng: 78.6022 }, // Wardha
    pincode: '440010',
    city: 'Nagpur',
  });
  assert.equal(farCoords.serviceable, false);
  assert.match(farCoords.reason, /perimeter|exceeds/);
});
