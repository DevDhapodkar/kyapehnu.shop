import { collection, getDocs } from 'firebase/firestore';

import { db, isFirebaseConfigured } from '../config/firebase';

/**
 * Read the storefront catalogue straight from Cloud Firestore.
 *
 * This is the "real database" connection for browsing: the same free Firebase
 * project that backs auth also holds the `products` collection, read directly by
 * the client SDK (public read per firestore.rules) — no Express server or
 * MongoDB required. Seed it with `backend/scripts/seedFirestore.js`.
 *
 * Seeded documents are already stored in the UI shape (department, type, price,
 * mrp, sizes as strings, storeLocation…), so mapping is just `{ id, ...data }`.
 */
export const fetchFirestoreProducts = async () => {
  if (!isFirebaseConfigured() || !db) return [];

  const snapshot = await getDocs(collection(db, 'products'));
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((p) => p.isAvailable !== false);
};

export default fetchFirestoreProducts;
