import { placeOrder } from '../api/vendorApi';

/**
 * Turn a multi-shop bag into real orders.
 *
 * Orders are per-vendor on the backend, so a bag spanning two shops becomes two
 * `POST /api/orders` calls — each one triggers that shop's WhatsApp + push
 * alert. The delivery address (already carrying the map-pin coordinates the
 * buyer confirmed) is attached to every order.
 *
 * @param {object} params
 * @param {Array} params.items          Cart lines (each carries `storeId`, `productId`, …).
 * @param {object} params.deliveryAddress  `{ label, line1, line2, city, pincode, receiverName, receiverPhone, location }`.
 * @param {number} params.deliveryFee   Flat fee added to each shop's order total.
 * @returns {Promise<Array>} Placed orders, normalised for the tracking screen.
 */
export const placeCartOrders = async ({ items, deliveryAddress, deliveryFee }) => {
  // Group the bag by vendor (storeId) — one order per shop.
  const byVendor = new Map();
  for (const item of items) {
    if (!item.storeId) continue;
    if (!byVendor.has(item.storeId)) byVendor.set(item.storeId, []);
    byVendor.get(item.storeId).push(item);
  }

  if (byVendor.size === 0) {
    throw new Error('These items are not linked to a shop yet — pull to refresh the storefront.');
  }

  const placed = [];
  for (const [vendorId, vendorItems] of byVendor) {
    const order = await placeOrder({
      vendor: vendorId,
      items: vendorItems.map((it) => ({
        product: it.productId,
        name: it.name,
        size: it.size ?? 'FREE',
        quantity: it.quantity,
        price: it.price,
      })),
      totalPrice:
        vendorItems.reduce((sum, it) => sum + it.price * it.quantity, 0) + deliveryFee,
      deliveryAddress,
      paymentMethod: 'COD',
    });

    // Keep the original cart items (they carry storeName / storeCoordinates /
    // etaMinutes) for the tracking screen, and normalise the backend field names.
    placed.push({
      id: order._id,
      total: order.totalPrice,
      items: vendorItems,
      placedAt: order.createdAt || new Date().toISOString(),
    });
  }

  return placed;
};
