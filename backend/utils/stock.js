// Stock reservation and restoration as atomic, single-document updates.
//
// The order controller validates stock with a read before writing (see
// utils/orderPricing.js), but a read cannot hold a reservation: two carts can
// both pass the check and then both decrement, driving a size below zero. The
// guard here closes that — a reservation only matches a size row that still
// holds enough stock, and because MongoDB applies each document update
// indivisibly, concurrent reservations of the last units cannot both succeed.

/**
 * Build the { filter, update } for one cart line's stock movement.
 *
 * `sign` is -1 to reserve on order (conditional — never goes negative) or +1
 * to restore on cancellation (unconditional). The positional `$` targets the
 * size row the filter matched.
 *
 * @param {{ product: unknown, size: string, quantity: number }} item
 * @param {-1 | 1} sign
 * @returns {{ filter: object, update: object }}
 */
export const buildStockUpdate = (item, sign) => {
  const quantity = Number(item?.quantity) || 0;

  if (sign < 0) {
    return {
      filter: {
        _id: item.product,
        sizes: { $elemMatch: { size: item.size, stock: { $gte: quantity } } },
      },
      update: { $inc: { 'sizes.$.stock': -quantity } },
    };
  }

  return {
    filter: { _id: item.product, 'sizes.size': item.size },
    update: { $inc: { 'sizes.$.stock': quantity } },
  };
};
