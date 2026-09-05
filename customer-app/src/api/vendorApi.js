import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Every call the vendor flow makes to the Express `/backend` goes through here.
 *
 * Screens never touch axios directly: they call the named helpers below, which
 * return plain data and throw `Error`s carrying the server's own message. That
 * keeps axios' response envelope (and its unhelpful "Request failed with
 * status code 500") out of the UI layer.
 */

const extra = Constants.expoConfig?.extra ?? {};

/**
 * The Android emulator cannot reach the host machine on `localhost` — that
 * resolves to the emulator itself. 10.0.2.2 is the loopback alias it provides.
 * On a physical device set `extra.apiBaseUrl` in app.json to the LAN IP.
 */
const resolveBaseUrl = () => {
  const configured = extra.apiBaseUrl || 'https://kyapehnu-backend.onrender.com';

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    // On any production domain (kyapehnu.shop, vercel.app) or HTTPS page,
    // always use the production HTTPS API.
    if (
      window.location.protocol === 'https:' ||
      host.includes('kyapehnu.shop') ||
      host.includes('vercel.app')
    ) {
      return configured;
    }

    // Local development only (http://localhost or 127.0.0.1)
    if (host === 'localhost' || host === '127.0.0.1') {
      return configured;
    }
  }

  return configured;
};

export const API_BASE_URL = resolveBaseUrl();

// The backend runs on Render's free tier, which spins the instance down after
// ~15 min idle and takes 30–60s to cold-start. A short timeout turns that nap
// into a "network error" on the first request after a lull (the classic
// "sign-up failed but the account exists" report), so we wait long enough for
// the dyno to wake and retry idempotent reads/upserts below.
const REQUEST_TIMEOUT_MS = 45000;

// eslint-disable-next-line import/no-named-as-default-member
const client = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Firebase ID token for the signed-in account. Held in a module variable
 * rather than read out of the store so the interceptor stays synchronous and
 * `useAuthStore` remains the only writer (it calls `setAuthToken` on sign-in
 * and sign-out). `extra.devAuthToken` seeds it during local development,
 * before the Firebase Auth screens exist.
 */
let authToken = extra.devAuthToken || null;

export const setAuthToken = (token) => {
  authToken = token || null;
};

export const getAuthToken = () => authToken;

client.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

/** Collapses an axios failure into a single readable sentence. */
const toError = (error, fallback) => {
  const data = error.response?.data;
  const message = data?.message || data?.error || error.message || fallback;
  const wrapped = new Error(message);
  wrapped.status = error.response?.status;
  wrapped.data = data;
  return wrapped;
};

/**
 * True when a failure is worth retrying: a cold-starting or briefly overloaded
 * server (no response, a timeout, or a 5xx). A 4xx is the caller's fault and is
 * never retried — repeating it just wastes the shopper's time.
 */
const isTransient = (error) => {
  if (!error.response) return true; // network error or timeout — no HTTP reply
  const status = error.response.status;
  return status >= 500 && status < 600;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs `fn`, unwraps axios' envelope, and rethrows a single readable Error.
 *
 * `retries` re-attempts transient failures with exponential backoff — set it
 * only for calls that are safe to repeat (reads and idempotent upserts). Never
 * retry a non-idempotent create (e.g. placing an order), or a cold start could
 * silently duplicate it.
 *
 * @param {() => Promise<import('axios').AxiosResponse>} fn
 * @param {string} fallback
 * @param {{ retries?: number }} [options]
 */
const request = async (fn, fallback, { retries = 0 } = {}) => {
  let attempt = 0;

  for (;;) {
    try {
      const response = await fn();
      return response.data;
    } catch (error) {
      if (attempt < retries && isTransient(error)) {
        attempt += 1;
        await wait(800 * 2 ** (attempt - 1)); // 800ms, 1.6s, 3.2s, …
        continue;
      }
      throw toError(error, fallback);
    }
  }
};

/* ------------------------------------------------------------- profiles -- */

/** POST /api/users/sync — upsert the customer profile for the signed-in uid. */
export const syncUserProfile = (payload) =>
  request(() => client.post('/users/sync', payload), 'Failed to sync profile', { retries: 3 });

/** GET /api/users/me — the customer profile behind the current token. */
export const fetchUserProfile = () =>
  request(() => client.get('/users/me'), 'Failed to load profile', { retries: 2 });

/** POST /api/users/me/addresses — save a delivery address to the profile book. */
export const saveUserAddress = (address) =>
  request(() => client.post('/users/me/addresses', address), 'Failed to save address');

/** DELETE /api/users/me/addresses/:addressId — remove a saved delivery address. */
export const deleteUserAddress = (addressId) =>
  request(() => client.delete(`/users/me/addresses/${addressId}`), 'Failed to delete address');

/** POST /api/vendors/sync — register or update the shop for the signed-in uid. */
export const registerVendor = (payload) =>
  request(() => client.post('/vendors/sync', payload), 'Failed to register shop');

/* ------------------------------------------------------------ storefront -- */

/**
 * GET /api/products — public storefront feed of approved, in-stock listings.
 * @param {{ category?: string, page?: number, limit?: number }} [params]
 */
export const fetchStorefront = (params) =>
  request(() => client.get('/products', { params }), 'Failed to load products', { retries: 3 });

/* --------------------------------------------------------------- orders -- */

/** POST /api/orders — place a customer order (one vendor per order). */
export const placeOrder = (payload) =>
  request(() => client.post('/orders', payload), 'Failed to place order');

/** POST /api/orders/guest — guest COD order from checkout (no auth required). */
export const createGuestOrder = (payload) =>
  request(() => client.post('/orders/guest', payload), 'Failed to place guest order');

/** GET /api/orders/track — public order tracking for guest orders. */
export const trackGuestOrder = (orderId, phone) =>
  request(() => client.get('/orders/track', { params: { orderId, phone } }), 'Failed to track order');

/** GET /api/vendors/nearby — nearby boutiques discovery. */
export const fetchNearbyVendors = (params) =>
  request(() => client.get('/vendors/nearby', { params }), 'Failed to load nearby boutiques', { retries: 2 });

/** GET /api/orders/mine — the signed-in customer's orders, newest first. */
export const fetchMyOrders = () =>
  request(() => client.get('/orders/mine'), 'Failed to load your orders', { retries: 2 });

/** PATCH /api/orders/:id/cancel — customer cancels their own order. */
export const cancelMyOrder = (orderId, reason) =>
  request(() => client.patch(`/orders/${orderId}/cancel`, { reason }), 'Failed to cancel order');

/** PATCH /api/orders/:id/status — vendor advances an order (PACKED, IN_TRANSIT, DELIVERED, CANCELLED). */
export const updateOrderStatus = (orderId, status, note) =>
  request(
    () => client.patch(`/orders/${orderId}/status`, { status, note }),
    'Failed to update order'
  );

/* ------------------------------------------------------- push notifications -- */

/** POST /api/users/me/push-token — register the customer's device for order updates. */
export const registerUserPushToken = (token) =>
  request(() => client.post('/users/me/push-token', { token }), 'Failed to register device');

/** POST /api/vendors/me/push-token — register the shop's device for new-order alerts. */
export const registerVendorPushToken = (token) =>
  request(() => client.post('/vendors/me/push-token', { token }), 'Failed to register device');

/* --------------------------------------------------------------- uploads -- */

/**
 * POST /api/uploads/images — multipart upload of picked images & videos. Accepts the
 * asset objects expo-image-picker returns and resolves to
 * `{ images: [{ url, publicId, resourceType, thumbnails }] }`.
 * @param {{ uri: string, fileName?: string, mimeType?: string, type?: string, file?: any }[]} assets
 */
export const uploadProductImages = async (assets) => {
  const form = new FormData();

  for (let index = 0; index < assets.length; index++) {
    const asset = assets[index];
    const isVideo =
      asset.type === 'video' ||
      asset.mimeType?.startsWith('video/') ||
      asset.uri?.endsWith('.mp4') ||
      asset.uri?.endsWith('.mov');
    const ext = isVideo ? 'mp4' : 'jpg';
    const fallbackName = `media_${Date.now()}_${index}.${ext}`;
    const name = asset.fileName || fallbackName;
    const type = asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg');

    if (Platform.OS === 'web') {
      if (asset.file) {
        form.append('images', asset.file, name);
      } else {
        try {
          const res = await fetch(asset.uri);
          const blob = await res.blob();
          form.append('images', blob, name);
        } catch {
          form.append('images', { uri: asset.uri, name, type });
        }
      }
    } else {
      form.append('images', {
        uri: asset.uri,
        name,
        type,
      });
    }
  }

  return request(
    () =>
      client.post('/uploads/images', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    'Failed to upload media'
  );
};

/* ---------------------------------------------------------------- vendor -- */

/** GET /api/vendors/me — the shop profile behind the current token. */
export const fetchVendorProfile = () =>
  request(() => client.get('/vendors/me'), 'Failed to load shop profile', { retries: 2 });

/* ---------------------------------------------------------------- orders -- */

/**
 * GET /api/orders/vendor/mine
 * @param {string[]} [statuses] e.g. ['PENDING', 'ACCEPTED'] — omit for all.
 */
export const fetchVendorOrders = (statuses) =>
  request(
    () =>
      client.get('/orders/vendor/mine', {
        params: statuses?.length ? { status: statuses.join(',') } : undefined,
      }),
    'Failed to load orders'
  );

/** GET /api/orders/:orderId */
export const fetchOrder = (orderId) =>
  request(() => client.get(`/orders/${orderId}`), 'Failed to load order');

/** PATCH /api/orders/:orderId/status — the "Accept Order" action. */
export const acceptOrder = (orderId) =>
  request(
    () => client.patch(`/orders/${orderId}/status`, { status: 'ACCEPTED' }),
    'Failed to accept order'
  );

/**
 * POST /api/orders/:orderId/ready — the "Mark Ready for Pickup" action.
 *
 * This is the one call with real-world side effects: the backend dispatches a
 * Porter driver to the store and sends the vendor a WhatsApp confirmation, in
 * parallel. Resolves to `{ order, logistics: { porter, whatsapp } }` where each
 * logistics entry is `{ ok: true }` or `{ ok: false, error }` — a driver can
 * fail to dispatch while the order itself moved on, so callers should surface
 * `logistics` rather than assume a 200 means both legs succeeded.
 */
export const markOrderReady = (orderId) =>
  request(() => client.post(`/orders/${orderId}/ready`), 'Failed to mark order ready');

/* --------------------------------------------------------------- catalog -- */

/** GET /api/products/mine — includes out-of-stock listings. */
export const fetchCatalog = () =>
  request(() => client.get('/products/mine'), 'Failed to load catalog', { retries: 2 });

/** PATCH /api/products/:productId — the In Stock / Out of Stock toggle. */
export const setProductAvailability = (productId, isAvailable) =>
  request(
    () => client.patch(`/products/${productId}`, { isAvailable }),
    'Failed to update availability'
  );

/** POST /api/products — new listing from the catalog manager. */
export const createProduct = (payload) =>
  request(() => client.post('/products', payload), 'Failed to create listing');

export default client;
