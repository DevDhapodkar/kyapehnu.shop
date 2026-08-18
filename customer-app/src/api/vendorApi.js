import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import * as desk from '../vendor/vendorDesk';

/**
 * Every call the vendor flow makes goes through here.
 *
 * Screens never touch axios directly: they call the named helpers below, which
 * return plain data and throw `Error`s carrying a readable message. When a
 * vendor is signed in with Firebase configured (`desk.isVendorDeskLive()`), the
 * vendor-desk helpers read/write Cloud Firestore — the connected database;
 * otherwise they fall back to the Express + MongoDB REST backend.
 */

const extra = Constants.expoConfig?.extra ?? {};

/**
 * The Android emulator cannot reach the host machine on `localhost` — that
 * resolves to the emulator itself. 10.0.2.2 is the loopback alias it provides.
 * On a physical device set `extra.apiBaseUrl` in app.json to the LAN IP.
 */
const resolveBaseUrl = () => {
  const configured =
    process.env.EXPO_PUBLIC_API_BASE_URL || extra.apiBaseUrl || 'http://localhost:5000';

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

const request = async (fn, fallback) => {
  try {
    const response = await fn();
    return response.data;
  } catch (error) {
    throw toError(error, fallback);
  }
};

/* ------------------------------------------------------------------ user -- */

/**
 * POST /api/users/sync — upsert the MongoDB User profile behind the signed-in
 * Firebase account. Called after every sign-in so the Express backend mirrors
 * the Firestore profile; the app works on Firebase alone if this fails, so
 * callers treat it as best-effort.
 */
export const syncUserProfile = (profile) =>
  request(() => client.post('/users/sync', profile), 'Failed to sync profile');

/* -------------------------------------------------------------- catalog -- */

/**
 * GET /api/products — the public storefront feed + search. Accepts facet
 * filters and a text query `q`; returns available products across all vendors
 * with the vendor populated. No auth required.
 */
export const fetchProducts = (params = {}) =>
  request(() => client.get('/products', { params }), 'Failed to load products');

/* --------------------------------------------------- vendor application -- */

/** POST /api/vendor-applications — submit or update the "become a vendor" form. */
export const submitVendorApplication = (payload) =>
  request(() => client.post('/vendor-applications', payload), 'Failed to submit application');

/** GET /api/vendor-applications/me — the applicant's own application, or null. */
export const fetchMyVendorApplication = () =>
  request(() => client.get('/vendor-applications/me'), 'Failed to load application');

/* ---------------------------------------------------------------- vendor -- */

/** The shop profile for the signed-in vendor (Firestore, or REST fallback). */
export const fetchVendorProfile = () =>
  desk.isVendorDeskLive()
    ? desk.fetchVendorProfileFS()
    : request(() => client.get('/vendors/me'), 'Failed to load shop profile');

/* ---------------------------------------------------------------- orders -- */

/**
 * The vendor's orders, optionally filtered by status.
 * @param {string[]} [statuses] e.g. ['PENDING', 'ACCEPTED'] — omit for all.
 */
export const fetchVendorOrders = (statuses) =>
  desk.isVendorDeskLive()
    ? desk.fetchVendorOrdersFS(statuses)
    : request(
        () =>
          client.get('/orders/vendor/mine', {
            params: statuses?.length ? { status: statuses.join(',') } : undefined,
          }),
        'Failed to load orders'
      );

/** A single order by id. */
export const fetchOrder = (orderId) =>
  desk.isVendorDeskLive()
    ? desk.fetchOrderFS(orderId)
    : request(() => client.get(`/orders/${orderId}`), 'Failed to load order');

/** The "Accept Order" action — moves the order to ACCEPTED. */
export const acceptOrder = (orderId) =>
  desk.isVendorDeskLive()
    ? desk.acceptOrderFS(orderId)
    : request(
        () => client.patch(`/orders/${orderId}/status`, { status: 'ACCEPTED' }),
        'Failed to accept order'
      );

/**
 * "Mark Ready for Pickup". On the MongoDB backend this dispatches a Porter
 * driver and a WhatsApp confirmation in parallel and resolves to
 * `{ order, logistics: { porter, whatsapp } }`, where each logistics entry is
 * `{ ok: true }` or `{ ok: false, error }`. The Firestore desk advances the
 * status and reports logistics as not-run (those integrations live on the
 * server), so callers should surface `logistics` rather than assume success.
 */
export const markOrderReady = (orderId) =>
  desk.isVendorDeskLive()
    ? desk.markOrderReadyFS(orderId)
    : request(() => client.post(`/orders/${orderId}/ready`), 'Failed to mark order ready');

/* --------------------------------------------------------------- catalog -- */

/** The vendor's own listings, including out-of-stock ones. */
export const fetchCatalog = () =>
  desk.isVendorDeskLive()
    ? desk.fetchCatalogFS()
    : request(() => client.get('/products/mine'), 'Failed to load catalog');

/** The In Stock / Out of Stock toggle. */
export const setProductAvailability = (productId, isAvailable) =>
  desk.isVendorDeskLive()
    ? desk.setProductAvailabilityFS(productId, isAvailable)
    : request(
        () => client.patch(`/products/${productId}`, { isAvailable }),
        'Failed to update availability'
      );

/** New listing from the catalog manager. */
export const createProduct = (payload) =>
  desk.isVendorDeskLive()
    ? desk.createProductFS(payload)
    : request(() => client.post('/products', payload), 'Failed to create listing');

export default client;
