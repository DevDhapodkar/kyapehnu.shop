/**
 * Checkout logic — pure and RN/Firebase-free so the cart→orders transform and
 * the delivery-form rules are unit-tested in plain Node and reused by the
 * order-placing side effect (see placeOrders.js).
 *
 * A cart can hold items from several shops, but an order belongs to one vendor
 * (one shop packs and one driver collects). So checkout splits the cart into one
 * order per vendor — the standard marketplace resolution of the multi-vendor
 * cart the app has always allowed.
 */

/** Group cart lines by the vendor that fulfils them. */
export const groupByVendor = (cartItems = []) => {
  const groups = new Map();

  for (const item of cartItems) {
    const key = item.vendorUid || item.storeId || 'unassigned';
    if (!groups.has(key)) {
      groups.set(key, {
        vendorUid: item.vendorUid ?? null,
        storeId: item.storeId ?? null,
        storeName: item.storeName ?? 'Local shop',
        items: [],
      });
    }
    groups.get(key).items.push(item);
  }

  return [...groups.values()].map((g) => ({
    ...g,
    subtotal: g.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  }));
};

/**
 * Build the order documents (minus server-set fields like id/createdAt) from a
 * cart and the delivery details. One document per vendor group.
 */
export const buildOrders = (cartItems, { customer, deliveryAddress, customerUid }) =>
  groupByVendor(cartItems).map((group) => ({
    vendorUid: group.vendorUid,
    customerUid: customerUid ?? null,
    storeName: group.storeName,
    status: 'PENDING',
    items: group.items.map((i) => ({
      product: i.productId,
      name: i.name,
      size: i.size ?? null,
      quantity: i.quantity,
      price: i.price,
    })),
    totalPrice: group.subtotal,
    customer,
    deliveryAddress,
  }));

/** How many separate orders this cart will create (one per vendor). */
export const orderCount = (cartItems) => groupByVendor(cartItems).length;

/* --------------------------------------------------------- delivery form -- */

export const emptyDelivery = () => ({ name: '', phone: '', line1: '', city: 'Nagpur', pincode: '' });

const req = (value, message) => (String(value ?? '').trim() ? null : message);

/** Validate the delivery details. Returns `{ valid, errors }`. */
export const validateDelivery = (form) => {
  const errors = {};

  const name = req(form.name, 'Enter a name for the delivery.');
  if (name) errors.name = name;

  const digits = String(form.phone ?? '').replace(/[\s-]/g, '').replace(/^\+91/, '').replace(/^0/, '');
  if (!/^\d{10}$/.test(digits)) errors.phone = 'Enter a valid 10-digit phone number.';

  const line1 = req(form.line1, 'Enter the delivery address.');
  if (line1) errors.line1 = line1;

  if (!/^[1-9]\d{5}$/.test(String(form.pincode ?? '').trim())) {
    errors.pincode = 'Enter a valid 6-digit pincode.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
};

/** Split the flat delivery form into { customer, deliveryAddress } for an order. */
export const toDeliveryParts = (form) => ({
  customer: { name: String(form.name).trim(), phone: String(form.phone).trim() },
  deliveryAddress: {
    line1: String(form.line1).trim(),
    city: String(form.city ?? 'Nagpur').trim() || 'Nagpur',
    pincode: String(form.pincode).trim(),
  },
});

export default buildOrders;
