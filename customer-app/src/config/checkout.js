/**
 * Checkout constants shared by the cart and the delivery-address screens, so
 * the fee shown on the bag and the fee added to each order can never drift.
 */

/** Flat Porter delivery fee, in whole rupees, until the quote API is wired in. */
export const DELIVERY_FEE = 49;

/** Address label chips offered on the delivery screen. */
export const ADDRESS_LABELS = ['Home', 'Work', 'Other'];
