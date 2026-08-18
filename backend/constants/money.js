/**
 * Money constants for the platform, all denominated in **paise** (integer
 * smallest currency unit). We never store rupees as floats anywhere: the
 * ledger, order totals, product prices, and margins are all integer paise, and
 * only ever formatted to "₹x.yy" at the very edge (UI / invoice render).
 *
 * Rationale (per the data-layer review): floating-point rupees drift the moment
 * discounts, margin, and platform fees are summed. Integer paise are exact.
 */

/** Flat platform convenience fee charged to the customer at checkout, in paise. */
export const PLATFORM_FEE_PAISE = 2500; // ₹25.00

/**
 * Delivery fee, in paise. Zero while the Porter integration is deferred (the
 * company registration required to onboard Porter is still in progress). Once
 * Porter is live this becomes a per-order quote, not a constant.
 */
export const DEFAULT_DELIVERY_FEE_PAISE = 0;

/**
 * GST rate in basis points (e.g. 500 = 5%). Zero until the company has a GSTIN
 * and the tax treatment for apparel is finalised — see docs/05.
 */
export const DEFAULT_TAX_BPS = 0;

/** Currency metadata used by invoice + UI formatting. */
export const CURRENCY = Object.freeze({
  code: 'INR',
  symbol: '₹',
  subunitsPerUnit: 100,
});
