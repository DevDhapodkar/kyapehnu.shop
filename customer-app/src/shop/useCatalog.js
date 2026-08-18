import { useCallback, useEffect, useState } from 'react';

import { fetchProducts } from '../api/vendorApi';
import { allProducts as SAMPLE_PRODUCTS } from '../data/mockStores';
import { fetchFirestoreProducts } from './firestoreCatalog';
import { normalizeProducts } from './normalizeProduct';

/**
 * Load the storefront catalogue from the real database, falling back to the
 * bundled sample catalogue when nothing is connected or seeded. Sources are
 * tried in order:
 *
 *   1. Firestore — the free Firebase project already wired for auth also holds
 *      the `products` collection, read directly by the client SDK. This is the
 *      primary connection (no server required); seed it with
 *      backend/scripts/seedFirestore.js.
 *   2. REST /api/products — the Express + MongoDB backend, for deployments that
 *      run it.
 *   3. Sample catalogue — bundled demo data so browsing is never empty.
 *
 * Pure of React (no setState) so it can run in an effect's async continuation
 * and be reused by `reload`.
 *
 * @returns {Promise<{ products: object[], source: 'live' | 'sample' }>}
 */
export async function loadCatalog() {
  // 1) Firestore (the connected database).
  try {
    const docs = await fetchFirestoreProducts();
    if (docs.length) return { products: docs, source: 'live' };
  } catch {
    // fall through to the REST backend
  }

  // 2) Express + MongoDB backend, if one is running.
  try {
    const raw = await fetchProducts({ limit: 200 });
    const live = normalizeProducts(raw);
    if (live.length) return { products: live, source: 'live' };
  } catch {
    // fall through to sample data
  }

  // 3) Bundled sample catalogue.
  return { products: SAMPLE_PRODUCTS, source: 'sample' };
}

/**
 * useCatalog — the single source of shopping products for the app.
 *
 * Serves the sample catalogue immediately, then swaps in live backend data once
 * it arrives. `source` ('live' | 'sample') lets the UI show a subtle note.
 * Filtering/sorting stays client-side (shop/catalog.js) over whatever this
 * returns, so the grid is instant regardless of the source.
 */
export default function useCatalog() {
  const [state, setState] = useState({
    products: SAMPLE_PRODUCTS,
    source: 'sample',
    loading: true,
  });

  const reload = useCallback(async () => {
    const result = await loadCatalog();
    setState({ ...result, loading: false });
  }, []);

  useEffect(() => {
    let cancelled = false;
    // setState runs inside the promise continuation (async), never synchronously
    // in the effect body.
    loadCatalog().then((result) => {
      if (!cancelled) setState({ ...result, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...state, reload };
}
