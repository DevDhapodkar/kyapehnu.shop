import { useEffect, useState } from 'react';

import { fetchNearbyVendors, fetchVendorProducts } from '../api/customerApi';
import { getAuthToken } from '../api/vendorApi';
import { adaptCatalog } from '../data/catalogAdapter';
import { productsByProximity } from '../data/mockStores';

/**
 * Storefront data source. Fetches nearby APPROVED shops and their APPROVED,
 * in-stock products from the real backend and maps them to the UI shape. Falls
 * back to the bundled mock catalogue when there's no session token yet or the
 * backend is unreachable — so the app always renders something, and silently
 * upgrades to live data the moment a token + backend exist.
 *
 * @param {{latitude:number, longitude:number}} coords customer location
 * @returns {{ products, source: 'live'|'mock', loading, error, reload }}
 */
export default function useCatalog(coords) {
  const [state, setState] = useState({
    products: productsByProximity,
    source: 'mock',
    loading: false,
    error: null,
  });

  const lng = coords?.longitude;
  const lat = coords?.latitude;

  useEffect(() => {
    let cancelled = false;

    // No session yet → stay on mock data (protected endpoints would 401).
    if (!getAuthToken() || lng == null || lat == null) {
      setState((s) => ({ ...s, source: 'mock', products: productsByProximity }));
      return;
    }

    const load = async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const vendors = await fetchNearbyVendors({ lng, lat });
        const withProducts = await Promise.all(
          vendors.map(async (vendor) => ({
            vendor,
            products: await fetchVendorProducts(vendor._id).catch(() => []),
          }))
        );
        const products = adaptCatalog(withProducts, [lng, lat]);
        if (cancelled) return;
        // If the live catalogue is empty (e.g. nothing approved nearby), keep
        // mock data so the storefront isn't blank in a demo.
        if (products.length === 0) {
          setState({ products: productsByProximity, source: 'mock', loading: false, error: null });
        } else {
          setState({ products, source: 'live', loading: false, error: null });
        }
      } catch (err) {
        if (cancelled) return;
        setState({ products: productsByProximity, source: 'mock', loading: false, error: err.message });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [lng, lat]);

  return state;
}
