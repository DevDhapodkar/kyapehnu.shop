import client from './vendorApi';

/**
 * Customer-side API surface. Reuses the exact same axios instance (and single
 * auth-token seam) as the vendor client — the token set by `useAuthStore` via
 * `setAuthToken` is already attached by the request interceptor, so these calls
 * are authenticated the moment a session exists.
 *
 * Before this module the buyer flow had no way to reach the backend at all
 * (the app ran entirely on mockStores). These are the endpoints the storefront,
 * PDP, checkout, and order history need.
 */

/** Collapse an axios failure into a single readable Error, mirroring vendorApi. */
const toError = (error, fallback) => {
  const data = error.response?.data;
  const message = data?.message || data?.error || error.message || fallback;
  const wrapped = new Error(message);
  wrapped.status = error.response?.status;
  wrapped.data = data;
  return wrapped;
};

const request = async (fn, fallback) => {
  try {
    const response = await fn();
    return response.data;
  } catch (error) {
    throw toError(error, fallback);
  }
};

/* -------------------------------------------------------------- discovery -- */

/** GET /api/vendors/nearby — approved shops within radius of the customer. */
export const fetchNearbyVendors = ({ lng, lat, maxDistanceMeters = 5000 }) =>
  request(
    () => client.get('/vendors/nearby', { params: { lng, lat, maxDistanceMeters } }),
    'Failed to load nearby shops'
  );

/** GET /api/products/vendor/:vendorId — a shop's approved, in-stock catalogue. */
export const fetchVendorProducts = (vendorId) =>
  request(() => client.get(`/products/vendor/${vendorId}`), 'Failed to load shop products');

/** GET /api/products/:id — a single product for the PDP. */
export const fetchProduct = (productId) =>
  request(() => client.get(`/products/${productId}`), 'Failed to load product');

/* -------------------------------------------------------------- account --- */

/** POST /api/users/sync — upsert the customer profile after Firebase sign-in. */
export const syncUserProfile = (profile) =>
  request(() => client.post('/users/sync', profile), 'Failed to sync profile');

/** GET /api/users/me — the signed-in customer's backend profile (+ addresses). */
export const fetchMyProfile = () =>
  request(() => client.get('/users/me'), 'Failed to load profile');

/** POST /api/users/push-token — register this device for order notifications. */
export const registerPushToken = (token) =>
  request(() => client.post('/users/push-token', { token }), 'Failed to register device');

/* --------------------------------------------------------------- orders --- */

/**
 * POST /api/orders — place a Cash-on-Delivery order. Price, stock, and the ₹25
 * platform fee are computed server-side; we send only what we're allowed to.
 * `idempotencyKey` makes a double-tapped checkout resolve to one order.
 */
export const placeOrder = ({ vendorId, items, deliveryAddress, idempotencyKey }) =>
  request(
    () =>
      client.post('/orders', {
        vendorId,
        items,
        deliveryAddress,
        idempotencyKey,
        paymentMethod: 'COD',
      }),
    'Failed to place order'
  );

/** GET /api/orders/mine — the customer's order history. */
export const fetchMyOrders = () =>
  request(() => client.get('/orders/mine'), 'Failed to load your orders');

/** GET /api/orders/:id — a single order (owner-only on the backend). */
export const fetchOrder = (orderId) =>
  request(() => client.get(`/orders/${orderId}`), 'Failed to load order');

/** GET /api/orders/:id/invoice — the itemised bill for an order. */
export const fetchOrderInvoice = (orderId) =>
  request(() => client.get(`/orders/${orderId}/invoice`), 'Failed to load invoice');

/** POST /api/orders/:id/cancel — cancel a not-yet-accepted order. */
export const cancelOrder = (orderId, reason) =>
  request(() => client.post(`/orders/${orderId}/cancel`, { reason }), 'Failed to cancel order');
