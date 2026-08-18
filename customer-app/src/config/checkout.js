/**
 * Checkout money rules for the customer app, mirrored from the backend so the
 * bill the buyer sees matches what the server will compute. The server remains
 * authoritative — these values are for display and are re-derived (and enforced)
 * on `POST /api/orders`.
 */

/** Flat platform convenience fee, in whole rupees. Matches PLATFORM_FEE_PAISE. */
export const PLATFORM_FEE_RUPEES = 25;

/** Delivery fee is 0 while Porter is deferred (company registration pending). */
export const DELIVERY_FEE_RUPEES = 0;

/** The only tender until the payment gateway goes live. */
export const PAYMENT_METHOD = 'COD';
export const PAYMENT_METHOD_LABEL = 'Cash on Delivery';

/** Build the itemised bill (whole rupees) from a goods subtotal. */
export const computeBill = (subtotalRupees) => {
  const subtotal = Math.max(0, Math.round(subtotalRupees || 0));
  const deliveryFee = DELIVERY_FEE_RUPEES;
  const platformFee = PLATFORM_FEE_RUPEES;
  return {
    subtotal,
    deliveryFee,
    platformFee,
    total: subtotal + deliveryFee + platformFee,
  };
};

const OBJECT_ID = /^[a-f\d]{24}$/i;

/**
 * A cart line is backed by a real backend product only if its id looks like a
 * Mongo ObjectId. While the storefront still serves mock data, this stays false
 * and checkout uses the local demo path instead of hitting `/orders` with fake
 * ids. Once discovery is wired to `customerApi`, real ids flow through here.
 */
export const isRealCatalogItem = (item) => OBJECT_ID.test(String(item?.productId || ''));

export const cartIsOrderable = (items) =>
  items.length > 0 &&
  items.every(isRealCatalogItem) &&
  new Set(items.map((i) => i.storeId)).size === 1; // single-vendor order

/** Map cart lines to the `POST /api/orders` items payload. */
export const toOrderItems = (items) =>
  items.map((i) => ({ product: i.productId, size: i.size ?? 'ONE', quantity: i.quantity }));
