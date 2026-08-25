import { create } from 'zustand';

import { fetchStorefront } from '../api/vendorApi';

const PLACEHOLDER_IMAGE = 'https://picsum.photos/seed/kyapehnu/900/1200';

/**
 * Map a backend product (with its vendor populated) onto the shape every
 * customer screen already consumes (ProductCard, PDP, cart). Keeping the adapter
 * here means the storefront swapped from mock data to the live API without
 * touching those screens.
 * @param {any} p
 */
export const toUiProduct = (p) => {
  const coords = p.vendor?.location?.coordinates;
  return {
    id: p._id,
    name: p.name,
    category: p.category,
    price: p.discountPrice ?? p.price,
    mrp: p.discountPrice ? p.price : undefined,
    currency: 'INR',
    sizes: (p.sizes || []).map((s) => s.size),
    image: p.images?.[0] || PLACEHOLDER_IMAGE,
    images: p.images || [],
    description: p.description || '',
    colorway: (p.colors && p.colors.join(', ')) || '',
    // Retail attributes for the product detail page.
    brand: p.brand || '',
    material: p.material || '',
    pattern: p.pattern || '',
    fit: p.fit || '',
    occasion: p.occasion || '',
    careInstructions: p.careInstructions || '',
    netQuantity: p.netQuantity,
    countryOfOrigin: p.countryOfOrigin || '',
    sku: p.sku || '',
    // Vendor denormalised onto the line so the cart can build a per-shop order.
    storeId: p.vendor?._id,
    storeName: p.vendor?.shopName || 'Local shop',
    storeArea: p.vendor?.area || '',
    storeCoordinates: Array.isArray(coords)
      ? { latitude: coords[1], longitude: coords[0] }
      : null,
    distanceKm: undefined, // unknown without a geo calc against the buyer
    etaMinutes: undefined,
  };
};

export const useStorefrontStore = create((set) => ({
  products: [],
  loading: false,
  error: null,
  loaded: false,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const { items } = await fetchStorefront({ limit: 50 });
      set({ products: (items || []).map(toUiProduct), loading: false, loaded: true });
    } catch (error) {
      set({ error: error.message, loading: false, loaded: true });
    }
  },
}));

export default useStorefrontStore;
