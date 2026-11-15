import test from "node:test";
import assert from "node:assert/strict";
import {
  isPlaceholderPhone,
  buildCheckoutAddressFromSaved,
  buildCheckoutAddressFromForm,
  validateDeliveryBounds,
  validateNagpurDeliveryBounds,
} from "./checkoutAddress.js";

test("detects invented placeholder phones", () => {
  assert.equal(isPlaceholderPhone("+91 99999 99999"), true);
  assert.equal(isPlaceholderPhone("9999999999"), true);
  assert.equal(isPlaceholderPhone("+91 98765 43210"), false);
});

test("saved address without phone fails hard — no 99999 invent", () => {
  const result = buildCheckoutAddressFromSaved({
    address: {
      line1: "12 Palm Rd",
      city: "Mumbai",
      pincode: "400050",
      location: { type: "Point", coordinates: [72.83, 19.06] },
    },
    profile: { name: "Dev" },
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /phone|mobile/i);
});

test("saved address without coords fails hard", () => {
  const result = buildCheckoutAddressFromSaved({
    address: {
      line1: "12 Palm Rd",
      pincode: "400050",
      receiverName: "Dev",
      receiverPhone: "9876543210",
    },
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /pin|map|location|coord/i);
});

test("saved address with complete fields succeeds across India", () => {
  const result = buildCheckoutAddressFromSaved({
    address: {
      label: "HOME",
      line1: "12 Palm Rd",
      line2: "Bandra West",
      city: "Mumbai",
      pincode: "400050",
      receiverName: "Dev",
      receiverPhone: "9876543210",
      location: { type: "Point", coordinates: [72.83, 19.06] },
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.address.pincode, "400050");
  assert.equal(result.address.receiverPhone, "9876543210");
});

test("form address requires explicit pincode", () => {
  const result = buildCheckoutAddressFromForm({
    flatNo: "4",
    streetArea: "Brigade Road",
    detectedArea: "Commercial District",
    pincode: "",
    receiverName: "Dev",
    phone: "9876543210",
    coords: [77.61, 12.98],
    addressType: "HOME",
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /pincode|pin code/i);
});

test("saved address outside India coordinates fails hard (e.g. London)", () => {
  const result = buildCheckoutAddressFromSaved({
    address: {
      label: "HOME",
      line1: "Baker Street",
      city: "London",
      pincode: "400001",
      receiverName: "Dev",
      receiverPhone: "9876543210",
      location: { type: "Point", coordinates: [-0.1278, 51.5074] },
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.outOfBounds, true);
  assert.match(result.error, /India/i);
});

test("saved address with invalid pincode fails hard (e.g. 012345)", () => {
  const result = buildCheckoutAddressFromSaved({
    address: {
      label: "HOME",
      line1: "12 Palm Rd",
      city: "Delhi",
      pincode: "012345",
      receiverName: "Dev",
      receiverPhone: "9876543210",
      location: { type: "Point", coordinates: [77.21, 28.63] },
    },
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /pincode/i);
});

test("validateDeliveryBounds accepts valid Pan-India locations", () => {
  // Mumbai
  assert.equal(validateDeliveryBounds({ coords: [72.83, 19.06], pincode: "400050", city: "Mumbai" }).serviceable, true);
  // Bangalore
  assert.equal(validateDeliveryBounds({ coords: [77.61, 12.98], pincode: "560001", city: "Bangalore" }).serviceable, true);
  // Delhi
  assert.equal(validateDeliveryBounds({ coords: [77.21, 28.63], pincode: "110001", city: "Delhi" }).serviceable, true);
  // Kolkata
  assert.equal(validateDeliveryBounds({ coords: [88.36, 22.57], pincode: "700001", city: "Kolkata" }).serviceable, true);
  // Nagpur
  assert.equal(validateDeliveryBounds({ coords: [79.08, 21.14], pincode: "440010", city: "Nagpur" }).serviceable, true);
});
