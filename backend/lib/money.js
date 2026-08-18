import { CURRENCY } from '../constants/money.js';

/**
 * Money helpers. Everything internal is integer paise; these functions are the
 * only sanctioned way to move between paise, rupees, and display strings so the
 * rounding rule lives in exactly one place.
 */

/** True for a safe, non-negative integer paise amount. */
export const isValidPaise = (value) =>
  Number.isInteger(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;

/**
 * Convert a rupee amount (number or numeric string) to integer paise.
 * Rounds half-up to the nearest paise. Throws on non-finite input so a bad
 * value fails loudly at the boundary instead of silently becoming NaN paise.
 */
export const rupeesToPaise = (rupees) => {
  const n = typeof rupees === 'string' ? Number(rupees) : rupees;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) {
    throw new Error(`Invalid rupee amount: ${rupees}`);
  }
  return Math.round(n * CURRENCY.subunitsPerUnit);
};

/** Convert integer paise to a rupee Number (may be fractional). */
export const paiseToRupees = (paise) => paise / CURRENCY.subunitsPerUnit;

/**
 * Apply a basis-points rate to a paise amount, rounded half-up.
 * e.g. taxPaise(10000, 500) => 500 (5% of ₹100 = ₹5).
 */
export const applyBps = (paise, bps) => Math.round((paise * bps) / 10000);

/** Format integer paise as a display string, e.g. 2500 => "₹25.00". */
export const formatPaise = (paise) => {
  const sign = paise < 0 ? '-' : '';
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / CURRENCY.subunitsPerUnit);
  const sub = String(abs % CURRENCY.subunitsPerUnit).padStart(2, '0');
  return `${sign}${CURRENCY.symbol}${rupees.toLocaleString('en-IN')}.${sub}`;
};
