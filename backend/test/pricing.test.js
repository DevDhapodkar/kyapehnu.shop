import { test } from 'node:test';
import assert from 'node:assert/strict';

import { sellingPricePaise, computeOrderPricing } from '../services/pricing.js';
import { PLATFORM_FEE_PAISE } from '../constants/money.js';

test('sellingPricePaise = base + margin', () => {
  assert.equal(sellingPricePaise(100000, 20000), 120000); // ₹1000 + ₹200
});

test('sellingPricePaise rejects invalid paise', () => {
  assert.throws(() => sellingPricePaise(-1, 0));
  assert.throws(() => sellingPricePaise(100, 12.5));
});

test('computeOrderPricing sums goods, adds the ₹25 platform fee, and splits payout vs margin', () => {
  // Two lines: ₹1000 base + ₹200 margin x2, and ₹500 base + ₹100 margin x1
  const pricing = computeOrderPricing([
    { basePricePaise: 100000, marginPaise: 20000, quantity: 2 },
    { basePricePaise: 50000, marginPaise: 10000, quantity: 1 },
  ]);

  // items subtotal = (120000*2) + (60000*1) = 300000 (₹3000)
  assert.equal(pricing.itemsSubtotalPaise, 300000);
  // platform fee is ₹25 flat
  assert.equal(pricing.platformFeePaise, PLATFORM_FEE_PAISE);
  assert.equal(pricing.platformFeePaise, 2500);
  // delivery + tax are zero while Porter/GST are deferred
  assert.equal(pricing.deliveryFeePaise, 0);
  assert.equal(pricing.taxPaise, 0);
  // grand total = 300000 + 2500 = 302500 (₹3025)
  assert.equal(pricing.grandTotalPaise, 302500);
  // vendor is owed the base prices only: (100000*2)+(50000*1) = 250000
  assert.equal(pricing.vendorPayoutPaise, 250000);
  // platform margin on goods: (20000*2)+(10000*1) = 50000
  assert.equal(pricing.marginTotalPaise, 50000);
  // platform earnings = margin + platform fee = 52500
  assert.equal(pricing.platformEarningsPaise, 52500);
});

test('computeOrderPricing preserves the identity: subtotal = payout + margin', () => {
  const pricing = computeOrderPricing([
    { basePricePaise: 79900, marginPaise: 12000, quantity: 3 },
  ]);
  assert.equal(
    pricing.itemsSubtotalPaise,
    pricing.vendorPayoutPaise + pricing.marginTotalPaise
  );
});

test('computeOrderPricing honours overridden fee/tax options', () => {
  const pricing = computeOrderPricing(
    [{ basePricePaise: 100000, marginPaise: 0, quantity: 1 }],
    { platformFeePaise: 2500, deliveryFeePaise: 4900, taxBps: 500 }
  );
  assert.equal(pricing.taxPaise, 5000); // 5% of ₹1000
  assert.equal(pricing.grandTotalPaise, 100000 + 4900 + 5000 + 2500);
  assert.equal(pricing.platformEarningsPaise, 0 + 2500 + 4900);
});

test('computeOrderPricing rejects empty carts and bad quantities', () => {
  assert.throws(() => computeOrderPricing([]));
  assert.throws(() =>
    computeOrderPricing([{ basePricePaise: 100, marginPaise: 0, quantity: 0 }])
  );
});
