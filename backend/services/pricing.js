import {
  PLATFORM_FEE_PAISE,
  DEFAULT_DELIVERY_FEE_PAISE,
  DEFAULT_TAX_BPS,
} from '../constants/money.js';
import { applyBps, isValidPaise } from '../lib/money.js';

/**
 * Pure order-pricing engine. No database, no framework — takes already-resolved
 * line items and returns the full money breakdown, so it can be unit-tested in
 * isolation and reused by both order creation and the invoice generator.
 *
 * The single source of truth for what a customer pays: NEVER trust a
 * client-supplied total. `orderService` resolves each cart line against the
 * APPROVED product in the DB, then hands the trusted figures here.
 *
 * Money model
 * -----------
 *   sellingPrice = basePrice (vendor's price) + margin (Kya Pehnu's cut, set by
 *                  an admin at product approval time)
 *
 *   itemsSubtotal = Σ sellingPrice · qty      (what the customer pays for goods)
 *   vendorPayout  = Σ basePrice   · qty       (what the vendor is owed)
 *   marginTotal   = Σ margin      · qty       (platform margin on the goods)
 *   platformFee   = flat convenience fee (₹25)
 *   grandTotal    = itemsSubtotal + deliveryFee + tax + platformFee
 *   platformEarnings = marginTotal + platformFee   (+ deliveryFee once real)
 */

/** Per-unit selling price = vendor base + platform margin, all in paise. */
export const sellingPricePaise = (basePricePaise, marginPaise) => {
  if (!isValidPaise(basePricePaise)) {
    throw new Error(`Invalid basePrice paise: ${basePricePaise}`);
  }
  if (!isValidPaise(marginPaise)) {
    throw new Error(`Invalid margin paise: ${marginPaise}`);
  }
  return basePricePaise + marginPaise;
};

/**
 * @param {Array<{ basePricePaise:number, marginPaise:number, quantity:number }>} lines
 * @param {object} [opts]
 * @param {number} [opts.platformFeePaise]
 * @param {number} [opts.deliveryFeePaise]
 * @param {number} [opts.taxBps]
 * @returns full pricing breakdown, all fields integer paise
 */
export const computeOrderPricing = (lines, opts = {}) => {
  const {
    platformFeePaise = PLATFORM_FEE_PAISE,
    deliveryFeePaise = DEFAULT_DELIVERY_FEE_PAISE,
    taxBps = DEFAULT_TAX_BPS,
  } = opts;

  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error('Cannot price an order with no line items');
  }

  let itemsSubtotal = 0;
  let vendorPayout = 0;
  let marginTotal = 0;

  const pricedLines = lines.map((line) => {
    const quantity = line.quantity;
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error(`Invalid quantity: ${quantity}`);
    }
    const unitSelling = sellingPricePaise(line.basePricePaise, line.marginPaise);
    const lineSubtotal = unitSelling * quantity;
    const lineVendorPayout = line.basePricePaise * quantity;
    const lineMargin = line.marginPaise * quantity;

    itemsSubtotal += lineSubtotal;
    vendorPayout += lineVendorPayout;
    marginTotal += lineMargin;

    return {
      ...line,
      unitSellingPricePaise: unitSelling,
      lineTotalPaise: lineSubtotal,
    };
  });

  const taxPaise = applyBps(itemsSubtotal, taxBps);
  const grandTotal = itemsSubtotal + deliveryFeePaise + taxPaise + platformFeePaise;
  const platformEarnings = marginTotal + platformFeePaise + deliveryFeePaise;

  return {
    currency: 'INR',
    lines: pricedLines,
    itemsSubtotalPaise: itemsSubtotal,
    deliveryFeePaise,
    taxPaise,
    platformFeePaise,
    grandTotalPaise: grandTotal,
    vendorPayoutPaise: vendorPayout,
    marginTotalPaise: marginTotal,
    platformEarningsPaise: platformEarnings,
  };
};
