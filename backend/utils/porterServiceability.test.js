import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateDistanceKm,
  isWithinIndiaBounds,
  isValidCity,
  isValidIndianPincode,
  checkServiceability,
  INDIA_CENTER,
} from './porterServiceability.js';

test('porterServiceability: Haversine distance calculation', () => {
  // Mumbai to Pune ~120km
  const dist = calculateDistanceKm(19.076, 72.8777, 18.5204, 73.8567);
  assert.ok(dist >= 100 && dist <= 150, `Expected ~120km, got ${dist}`);

  // Same coordinates = 0
  assert.equal(calculateDistanceKm(20.5937, 78.9629, 20.5937, 78.9629), 0);
});

test('porterServiceability: isWithinIndiaBounds', () => {
  // Mumbai
  assert.equal(isWithinIndiaBounds(19.076, 72.8777), true);
  // Delhi
  assert.equal(isWithinIndiaBounds(28.6139, 77.209), true);
  // Bangalore
  assert.equal(isWithinIndiaBounds(12.9716, 77.5946), true);
  // Kolkata
  assert.equal(isWithinIndiaBounds(22.5726, 88.3639), true);
  // Outside India: New York (should fail)
  assert.equal(isWithinIndiaBounds(40.7128, -74.006), false);
  // Outside India: London (should fail)
  assert.equal(isWithinIndiaBounds(51.5074, -0.1278), false);
});

test('porterServiceability: isValidCity', () => {
  assert.equal(isValidCity('Mumbai'), true);
  assert.equal(isValidCity('Delhi'), true);
  assert.equal(isValidCity('Bengaluru'), true);
  assert.equal(isValidCity('Pune'), true);
  assert.equal(isValidCity('Hyderabad'), true);
  assert.equal(isValidCity('Jaipur'), true);

  // Non-string or too short
  assert.equal(isValidCity('A'), false);
  assert.equal(isValidCity(''), true); // omitted city defaults gracefully
});

test('porterServiceability: isValidIndianPincode', () => {
  // Valid Indian 6-digit pincodes
  assert.equal(isValidIndianPincode('400001'), true); // Mumbai
  assert.equal(isValidIndianPincode('110001'), true); // Delhi
  assert.equal(isValidIndianPincode('560001'), true); // Bangalore
  assert.equal(isValidIndianPincode('700001'), true); // Kolkata
  assert.equal(isValidIndianPincode('500001'), true); // Hyderabad
  assert.equal(isValidIndianPincode('411001'), true); // Pune

  // Invalid pincodes
  assert.equal(isValidIndianPincode('012345'), false); // starts with 0
  assert.equal(isValidIndianPincode('12345'), false); // 5 digits
  assert.equal(isValidIndianPincode('1234567'), false); // 7 digits
  assert.equal(isValidIndianPincode('ABCDEF'), false);
  assert.equal(isValidIndianPincode(''), false);
});

test('porterServiceability: checkServiceability end-to-end', async () => {
  // 1. Hyperlocal delivery within city (<= 35km)
  const hyperlocalRes = await checkServiceability({
    pickup: { lat: 19.076, lng: 72.8777 },
    drop: { lat: 19.0596, lng: 72.8258 },
    pincode: '400050',
    city: 'Mumbai',
  });
  assert.equal(hyperlocalRes.serviceable, true);
  assert.equal(hyperlocalRes.tier, 'HYPERLOCAL');
  assert.equal(hyperlocalRes.estimatedDelivery, '45-60 mins');
  assert.ok(hyperlocalRes.distanceKm > 0 && hyperlocalRes.distanceKm <= 35);

  // 2. Pan-India Express delivery across cities (> 35km)
  const panIndiaRes = await checkServiceability({
    pickup: { lat: 19.076, lng: 72.8777 }, // Mumbai
    drop: { lat: 28.6139, lng: 77.209 }, // Delhi
    pincode: '110001',
    city: 'Delhi',
  });
  assert.equal(panIndiaRes.serviceable, true);
  assert.equal(panIndiaRes.tier, 'PAN_INDIA_EXPRESS');
  assert.equal(panIndiaRes.estimatedDelivery, '2-4 business days');
  assert.ok(panIndiaRes.distanceKm > 35);

  // 3. Reject invalid 6-digit pincode
  const wrongPin = await checkServiceability({
    drop: { lat: 19.076, lng: 72.8777 },
    pincode: '012345',
    city: 'Mumbai',
  });
  assert.equal(wrongPin.serviceable, false);
  assert.match(wrongPin.reason, /pincode/i);

  // 4. Reject coordinates outside India (e.g. London)
  const outsideIndia = await checkServiceability({
    pickup: { lat: 19.076, lng: 72.8777 },
    drop: { lat: 51.5074, lng: -0.1278 }, // London
    pincode: '400001',
    city: 'London',
  });
  assert.equal(outsideIndia.serviceable, false);
  assert.match(outsideIndia.reason, /India/);
});
