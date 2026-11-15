import test from "node:test";
import assert from "node:assert/strict";

import { checkOrderServiceability } from "../controllers/orderController.js";
import { checkServiceability } from "../controllers/porterController.js";

test("checkOrderServiceability: controller endpoint unit tests", async () => {
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

  // Test 2: valid Pan-India delivery location returns serviceable: true
  {
    let jsonResult = null;
    const req = {
      body: {
        deliveryAddress: {
          line1: "10 Brigade Road",
          city: "Bangalore",
          pincode: "560001",
          location: {
            type: "Point",
            coordinates: [77.607, 12.9719],
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
    assert.equal(jsonResult.city, "Bangalore");
    assert.equal(jsonResult.pincode, "560001");
  }

  // Test 3: Invalid 6-digit PIN code returns serviceable: false with reason
  {
    let jsonResult = null;
    const req = {
      body: {
        deliveryAddress: {
          line1: "Bandra West",
          city: "Mumbai",
          pincode: "012345",
          location: {
            type: "Point",
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
    assert.match(jsonResult.reason, /pincode/i);
  }

  // Test 4: Coordinates outside India service territory returns serviceable: false
  {
    const result = await checkServiceability({
      pickup: { lat: 19.076, lng: 72.8777 },
      drop: { lat: 51.5074, lng: -0.1278 }, // London
      city: "London",
      pincode: "400001",
    });
    assert.equal(result.serviceable, false);
    assert.match(result.reason, /India/i);
  }
});
