import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import { auth, db, isFirebaseConfigured } from '../config/firebase';

/**
 * Firestore-backed vendor desk.
 *
 * The vendor flow (order queue, order detail, catalog manager) reads and writes
 * its data straight from Cloud Firestore — the same connected database that
 * holds the storefront catalogue — rather than the MongoDB REST backend. Reads
 * are scoped to the signed-in vendor's uid; writes are gated by the same uid in
 * firestore.rules, so a shop can only touch its own orders and listings.
 *
 * Shapes are kept compatible with what the vendor screens already render
 * (`_id`, `items[]`, `sizes:[{size,stock}]`, …), so the screens are unchanged.
 */

/** Whether the desk should use Firestore (configured + a signed-in vendor). */
export const isVendorDeskLive = () => Boolean(isFirebaseConfigured() && db && auth?.currentUser);

const uid = () => auth.currentUser?.uid;

const sizeObjects = (sizes) =>
  (sizes ?? []).map((s) => (typeof s === 'string' ? { size: s, stock: 1 } : s));
const sizeStrings = (sizes) =>
  (sizes ?? []).map((s) => (typeof s === 'string' ? s : s.size)).filter(Boolean);

/* -------------------------------------------------------------- profile -- */

export const fetchVendorProfileFS = async () => {
  const snap = await getDoc(doc(db, 'vendors', uid()));
  if (!snap.exists()) throw new Error('No shop profile is linked to this account.');
  return { _id: snap.id, ...snap.data() };
};

/* --------------------------------------------------------------- orders -- */

const mapOrder = (snap) => ({ _id: snap.id, ...snap.data() });

export const fetchVendorOrdersFS = async (statuses) => {
  const snap = await getDocs(query(collection(db, 'orders'), where('vendorUid', '==', uid())));
  let orders = snap.docs.map(mapOrder);
  if (statuses?.length) orders = orders.filter((o) => statuses.includes(o.status));
  // Newest first; createdAt is an ISO string.
  return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const fetchOrderFS = async (orderId) => {
  const snap = await getDoc(doc(db, 'orders', orderId));
  if (!snap.exists()) throw new Error('Order not found.');
  return mapOrder(snap);
};

export const acceptOrderFS = async (orderId) => {
  await updateDoc(doc(db, 'orders', orderId), { status: 'ACCEPTED' });
  return fetchOrderFS(orderId);
};

/**
 * Advance an order to READY_FOR_PICKUP. The MongoDB backend also dispatches a
 * Porter driver and a WhatsApp message here; those integrations aren't wired to
 * the Firestore demo, so the status moves but logistics report as not-run rather
 * than faking success.
 */
export const markOrderReadyFS = async (orderId) => {
  await updateDoc(doc(db, 'orders', orderId), { status: 'READY_FOR_PICKUP' });
  const order = await fetchOrderFS(orderId);
  return {
    order,
    logistics: {
      porter: { ok: false, error: 'Porter not wired in the demo' },
      whatsapp: { ok: false, error: 'WhatsApp not wired in the demo' },
    },
  };
};

/* -------------------------------------------------------------- catalog -- */

const mapCatalogProduct = (snap) => {
  const d = snap.data();
  return {
    _id: snap.id,
    name: d.name,
    category: d.department ?? d.category ?? 'UNISEX',
    price: d.price,
    discountPrice: d.mrp && d.mrp > d.price ? undefined : d.discountPrice,
    sizes: sizeObjects(d.sizes),
    isAvailable: d.isAvailable !== false,
  };
};

export const fetchCatalogFS = async () => {
  const snap = await getDocs(query(collection(db, 'products'), where('vendorUid', '==', uid())));
  return snap.docs.map(mapCatalogProduct);
};

export const setProductAvailabilityFS = async (productId, isAvailable) => {
  await updateDoc(doc(db, 'products', productId), { isAvailable });
  const snap = await getDoc(doc(db, 'products', productId));
  return mapCatalogProduct(snap);
};

const placeholderImage = (name) =>
  `https://picsum.photos/seed/kyapehnu-${encodeURIComponent(name).slice(0, 24)}/900/1200`;

export const createProductFS = async (payload) => {
  const vendor = (await getDoc(doc(db, 'vendors', uid()))).data() ?? {};
  const image = placeholderImage(payload.name);

  const docData = {
    name: payload.name,
    description: payload.description ?? '',
    department: payload.category,
    type: payload.category,
    category: payload.category,
    price: payload.price,
    mrp: payload.price,
    sizes: sizeStrings(payload.sizes), // stored as strings for the customer feed
    image,
    images: [image],
    storeName: vendor.shopName ?? 'Your shop',
    storeArea: vendor.address?.area ?? null,
    storeLocation: vendor.location ?? null,
    vendorUid: uid(),
    isAvailable: payload.isAvailable !== false,
    createdAt: new Date().toISOString(),
  };

  const ref = await addDoc(collection(db, 'products'), docData);
  return {
    _id: ref.id,
    name: docData.name,
    category: docData.department,
    price: docData.price,
    sizes: sizeObjects(payload.sizes),
    isAvailable: docData.isAvailable,
  };
};

export default {
  isVendorDeskLive,
  fetchVendorProfileFS,
  fetchVendorOrdersFS,
  fetchOrderFS,
  acceptOrderFS,
  markOrderReadyFS,
  fetchCatalogFS,
  setProductAvailabilityFS,
  createProductFS,
};
