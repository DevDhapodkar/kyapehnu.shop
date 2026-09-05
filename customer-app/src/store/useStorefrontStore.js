import { create } from 'zustand';

import { fetchStorefront } from '../api/vendorApi';
import { mockStores } from '../data/mockStores';

const PLACEHOLDER_IMAGE = 'https://picsum.photos/seed/kyapehnu/900/1200';

export const getCuratedProducts = () => {
  const list = [];
  for (const store of mockStores || []) {
    for (const p of store.products || []) {
      list.push({
        id: p.id,
        name: p.name,
        category: p.category || 'SILKS',
        subCategory: p.category || 'Silks & Handlooms',
        price: p.price,
        mrp: p.mrp,
        originalPrice: p.mrp,
        currency: 'INR',
        sizes: p.sizes || ['S', 'M', 'L'],
        sizesWithStock: (p.sizes || ['S', 'M', 'L']).map((s) => ({ size: s, stock: 10 })),
        image: p.image,
        images: [p.image],
        description: p.description || '',
        colors: [{ name: p.colorway || 'Original', hex: '#1C1C21' }],
        colorway: p.colorway || 'Classic',
        brand: store.name,
        material: p.material || 'Premium Handloom',
        pattern: 'Artisanal',
        fit: 'Tailored Fit',
        sleeve: 'Standard',
        neck: 'Classic',
        occasion: 'Everyday & Festive',
        careInstructions: 'Dry Clean Recommended',
        care: 'Dry Clean Recommended',
        netQuantity: 1,
        countryOfOrigin: 'India (Nagpur)',
        returnPolicy: '7-day doorstep return',
        highlights: ['Locally sourced in Nagpur', 'Delivered in under 45 minutes'],
        sku: p.id,
        storeId: store.id,
        storeName: store.name,
        storeArea: store.area,
        locality: store.area,
        storeCoordinates: store.coordinates,
        distanceKm: store.distanceKm,
        etaMinutes: p.deliveryMinutes || store.etaMinutes,
        deliveryMinutes: p.deliveryMinutes || store.etaMinutes,
        gender: p.gender || 'Unisex',
      });
    }
  }
  return list;
};

const fallbackList = getCuratedProducts();

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

  const price = p.discountPrice ?? p.price;
  const mrp = p.mrp || (p.discountPrice ? p.price : undefined);
  const distanceKm =
    typeof p.vendor?.distanceKm === 'number'
      ? p.vendor.distanceKm
      : typeof p.distanceKm === 'number'
      ? p.distanceKm
      : 1.4;
  const deliveryMinutes =
    p.deliveryMinutes ||
    p.vendor?.etaMinutes ||
    (typeof distanceKm === 'number' ? Math.round(15 + distanceKm * 7) : 25);

  const rawGender =
    p.gender ||
    (p.category === 'WOMEN'
      ? 'Women'
      : p.category === 'MEN'
      ? 'Men'
      : 'Unisex');

  return {
    id: p._id,
    name: p.name,
    category: p.category || 'Apparel',
    subCategory: p.subCategory || '',
    gender: rawGender,
    price,
    mrp,
    originalPrice: mrp,
    currency: 'INR',
    sizes: (p.sizes || []).map((s) => (typeof s === 'object' ? s.size : s)),
    sizesWithStock: p.sizes || [],
    image: p.images?.[0] || PLACEHOLDER_IMAGE,
    images: p.images || [],
    description: p.description || '',
    colors: rawColors,
    colorway,
    // Retail attributes for the product detail page.
    brand: p.brand || p.vendor?.shopName || 'Nagpur Boutique',
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
    storeName: p.vendor?.shopName || p.brand || 'Local shop',
    storeArea: p.vendor?.address?.area || p.vendor?.area || 'Nagpur',
    locality: p.vendor?.address?.area || p.vendor?.area || 'Nagpur',
    storeCoordinates: Array.isArray(coords)
      ? { latitude: coords[1], longitude: coords[0] }
      : null,
    distanceKm,
    deliveryMinutes,
    etaMinutes: deliveryMinutes,
  };
};

export const useStorefrontStore = create((set) => ({
  products: fallbackList,
  loading: false,
  error: null,
  loaded: true,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const { items } = await fetchStorefront({ limit: 50 });
      if (items && items.length > 0) {
        set({ products: items.map(toUiProduct), loading: false, loaded: true, error: null });
      } else {
        set({ products: fallbackList, loading: false, loaded: true, error: null });
      }
    } catch (error) {
      console.warn('[useStorefrontStore] Live fetch note:', error.message);
      // Graceful fallback to curated Nagpur boutique catalog so app never shows an error
      set({ products: fallbackList, loading: false, loaded: true, error: null });
    }
  },
}));

export default useStorefrontStore;
