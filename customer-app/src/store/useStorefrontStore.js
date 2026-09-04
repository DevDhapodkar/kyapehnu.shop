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
  const rawColors = p.colors || [];
  const colorway = rawColors
    .map((c) => (typeof c === 'object' && c?.name ? c.name : String(c)))
    .join(', ');

  return {
    id: p._id,
    name: p.name,
    category: p.category,
    subCategory: p.subCategory || '',
    price: p.discountPrice ?? p.price,
    mrp: p.mrp || (p.discountPrice ? p.price : undefined),
    currency: 'INR',
    sizes: (p.sizes || []).map((s) => (typeof s === 'object' ? s.size : s)),
    sizesWithStock: p.sizes || [],
    image: p.images?.[0] || PLACEHOLDER_IMAGE,
    images: p.images || [],
    description: p.description || '',
    colors: rawColors,
    colorway,
    // Retail attributes for the product detail page.
    brand: p.brand || p.vendor?.shopName || '',
    material: p.material || '',
    pattern: p.pattern || '',
    fit: p.fit || '',
    sleeve: p.sleeve || '',
    neck: p.neck || '',
    occasion: p.occasion || '',
    careInstructions: p.careInstructions || '',
    care: p.careInstructions || '',
    netQuantity: p.netQuantity || 1,
    countryOfOrigin: p.countryOfOrigin || 'India',
    returnPolicy: p.returnPolicy || '7-day return',
    highlights: p.highlights || [],
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
