import test from 'node:test';
import assert from 'node:assert/strict';

import { checkOrderServiceability } from '../controllers/orderController.js';
import { checkServiceability } from '../controllers/porterController.js';

test('checkOrderServiceability: controller endpoint unit tests', async () => {
  // Test 1: missing deliveryAddress returns 400
  {
    let status = null;
    let jsonResult = null;
    const req = { body: {} };
    const res = {
      status(s) {
        status = s;
        return this;
      },
      json(j) {
        jsonResult = j;
        return this;
      },
    };

    await checkOrderServiceability(req, res);
    assert.equal(status, 400);
    assert.equal(jsonResult.serviceable, false);
    assert.match(jsonResult.message, /deliveryAddress is required/i);
  }

  // Test 2: valid Nagpur delivery location returns serviceable: true
  {
    let jsonResult = null;
    const req = {
      body: {
        deliveryAddress: {
          line1: '10 Dharampeth Main Road',
          city: 'Nagpur',
          pincode: '440010',
          location: {
            type: 'Point',
            coordinates: [79.0645, 21.1396],
          },
        },
      },
    };
    const res = {
      status() {
        return this;
      },
      json(j) {
        jsonResult = j;
        return this;
      },
    };

    await checkOrderServiceability(req, res);
    assert.equal(jsonResult.serviceable, true);
    assert.ok(jsonResult.distanceKm >= 0);
    assert.equal(jsonResult.city, 'Nagpur');
    assert.equal(jsonResult.pincode, '440010');
  }

  // Test 3: Out of delivery zone (Mumbai address) returns serviceable: false with reason
  {
    let jsonResult = null;
    const req = {
      body: {
        deliveryAddress: {
          line1: 'Bandra West',
          city: 'Mumbai',
          pincode: '400050',
          location: {
            type: 'Point',
            coordinates: [72.8258, 19.0596],
          },
        },
      },
    };
    const res = {
      status() {
        return this;
      },
      json(j) {
        jsonResult = j;
        return this;
      },
    };

    await checkOrderServiceability(req, res);
    assert.equal(jsonResult.serviceable, false);
    assert.match(jsonResult.reason, /Nagpur/i);
  }

  // Test 4: Out of bounds distance (> 25km, e.g. Wardha) returns serviceable: false
  {
    const result = await checkServiceability({
      pickup: { lat: 21.1458, lng: 79.0882 },
      drop: { lat: 20.7453, lng: 78.6022 },
      city: 'Nagpur',
      pincode: '440010',
    });
    assert.equal(result.serviceable, false);
    assert.match(result.reason, /exceeds|perimeter/i);
  }
});
