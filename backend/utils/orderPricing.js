// Server-side order pricing. The cart that arrives on the wire is a request,
// not a quote: the client says *what* it wants, the catalog says what it costs.
// Every price and the order total are recomputed here from the Product
// documents, so a tampered `price`/`totalPrice` in the request body cannot buy
// a ₹1499 shirt for ₹1.
//
// Pure and dependency-free on purpose — the controller does the I/O, this
// module does the arithmetic and the rules, and the tests need no database.

import { PRODUCT_STATUS } from './productStatus.js';

// Guard rails on a single COD order. Generous for a real shopper, tight enough
// that an unauthenticated guest cannot mint a 10,000-line order.
export const MAX_ITEMS_PER_ORDER = 20;
export const MAX_QUANTITY_PER_LINE = 10;

// Flat Porter delivery fee, charged once per order (orders are per-shop).
// The app shows this on the cart and address screens from
// customer-app/src/config/checkout.js — the two must move together, and this
// one is authoritative for what is actually billed.
export const DELIVERY_FEE = 49;

/**
 * @param {string} message
 * @returns {Error & { status: number }}
 */
const badRequest = (message) => {
  const err = new Error(message);
  err.status = 400;
  return err;
};

const idOf = (value) => (value == null ? '' : String(value));

/**
 * Reduce the request's cart to the only three fields the server trusts.
 * Anything else a client sends (price, name, discounts) is dropped here.
 * @param {unknown} items
 * @returns {Array<{ product: string, size: string, quantity: number }>}
 */
export const parseCartLines = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw badRequest('Your cart is empty');
  }
  if (items.length > MAX_ITEMS_PER_ORDER) {
    throw badRequest(`An order can hold at most ${MAX_ITEMS_PER_ORDER} items`);
  }

  return items.map((item, index) => {
    const position = `Item ${index + 1}`;
    const product = idOf(item?.product).trim();
    const size = idOf(item?.size).trim();
    const quantity = Number(item?.quantity);

    if (!product) throw badRequest(`${position} is missing a product`);
    if (!size) throw badRequest(`${position} is missing a size`);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw badRequest(`${position} needs a whole quantity of at least 1`);
    }
    if (quantity > MAX_QUANTITY_PER_LINE) {
      throw badRequest(`${position} is limited to ${MAX_QUANTITY_PER_LINE} per order`);
    }

    return { product, size, quantity };
  });
};

/**
 * Price the parsed lines against the catalog and total them.
 *
 * Also enforces what the storefront already implies but the write path never
 * checked: one vendor per order, only APPROVED and available listings, a real
 * size, and enough stock on hand. The stock check is a validation, not a
 * reservation — two carts can still pass it concurrently, which the vendor
 * resolves the same way an oversold shelf is resolved today.
 *
 * @param {Array<{ product: string, size: string, quantity: number }>} lines
 * @param {Array<object>} products Product documents loaded for those ids
 * @param {unknown} vendorId The vendor the order is being placed with
 * @returns {{ items: Array<object>, subtotal: number, deliveryFee: number, totalPrice: number }}
 */
export const priceOrderLines = (lines, products, vendorId) => {
  const catalog = new Map(products.map((product) => [idOf(product._id), product]));
  const shopId = idOf(vendorId);

  // Two lines for the same size draw down one shelf — bill them against it once.
  const claimed = new Map();

  const items = lines.map((line) => {
    const product = catalog.get(line.product);
    if (!product) throw badRequest('One of the items is no longer in the catalog');

    if (idOf(product.vendor) !== shopId) {
      throw badRequest(`"${product.name}" is sold by a different shop — order from one shop at a time`);
    }
    if (product.status !== PRODUCT_STATUS.APPROVED || !product.isAvailable) {
      throw badRequest(`"${product.name}" is not available right now`);
    }

    // A listing with no size variants at all is a free-size item (a scarf, a
    // stole). The app sends 'FREE' for those, and there is no shelf to count.
    const sized = (product.sizes || []).length > 0;

    if (sized) {
      const variant = product.sizes.find((s) => s.size === line.size);
      if (!variant) throw badRequest(`"${product.name}" does not come in size ${line.size}`);

      const key = `${line.product}:${line.size}`;
      const wanted = (claimed.get(key) || 0) + line.quantity;
      claimed.set(key, wanted);

      if (wanted > (variant.stock || 0)) {
        throw badRequest(`Only ${variant.stock || 0} left of "${product.name}" in size ${line.size}`);
      }
    }

    return {
      product: product._id,
      name: product.name,
      size: line.size,
      quantity: line.quantity,
      price: product.price,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return { items, subtotal, deliveryFee: DELIVERY_FEE, totalPrice: subtotal + DELIVERY_FEE };
};
