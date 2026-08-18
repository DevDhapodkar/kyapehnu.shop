import { useCallback, useEffect, useState } from 'react';

import { fetchProducts } from '../api/vendorApi';
import { allProducts as SAMPLE_PRODUCTS } from '../data/mockStores';
import { normalizeProducts } from './normalizeProduct';

/**
 * Load the storefront catalogue from the backend, normalise it, and fall back to
 * the bundled sample catalogue if the backend is unreachable or empty. Pure of
 * React (no setState) so it can be called from an effect's async continuation
 * without tripping the cascading-render rule, and reused by `reload`.
 *
 * @returns {Promise<{ products: object[], source: 'live' | 'sample' }>}
 */
export async function loadCatalog() {
  try {
    const raw = await fetchProducts({ limit: 200 });
    const live = normalizeProducts(raw);
    if (live.length) return { products: live, source: 'live' };
    return { products: SAMPLE_PRODUCTS, source: 'sample' };
  } catch {
    return { products: SAMPLE_PRODUCTS, source: 'sample' };
  }
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
