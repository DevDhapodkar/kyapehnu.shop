import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Every network call the vendor app makes to `/backend` goes through here.
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
  const configured = extra.apiBaseUrl || 'http://localhost:5000';

  if (Platform.OS === 'android') {
    return configured.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }

  return configured;
};

export const API_BASE_URL = resolveBaseUrl();

const client = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Firebase ID token for the signed-in shop owner. Held in a module variable
 * rather than the store so the interceptor can read it synchronously without
 * subscribing to React state. `extra.devAuthToken` seeds it during local
 * development, before the Firebase Auth screens exist.
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

const request = async (fn, fallback) => {
  try {
    const response = await fn();
    return response.data;
  } catch (error) {
    throw toError(error, fallback);
  }
};

/* ---------------------------------------------------------------- vendor -- */

/** GET /api/vendors/me — the shop profile behind the current token. */
export const fetchVendorProfile = () =>
  request(() => client.get('/vendors/me'), 'Failed to load shop profile');

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
  request(() => client.get('/products/mine'), 'Failed to load catalog');

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
