import { create } from 'zustand';

import { fetchStorefront } from '../api/vendorApi';
import { mockStores } from '../data/mockStores';
import { resolveStorefrontLoadResult } from '../utils/storefrontLoad';

/**
 * Curated mock catalogue — for local demos only.
 * Opt in with EXPO_PUBLIC_USE_MOCK_CATALOGUE=1; never used as a silent prod fallback.
 */
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

const allowMockCatalogue =
  typeof process !== 'undefined' &&
  process.env?.EXPO_PUBLIC_USE_MOCK_CATALOGUE === '1';

/**
 * Map a backend product (with its vendor populated) onto the shape every
 * customer screen already consumes (ProductCard, PDP, cart).
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
      : null;
  const deliveryMinutes =
    p.deliveryMinutes ||
    p.vendor?.etaMinutes ||
    (typeof distanceKm === 'number' ? Math.round(15 + distanceKm * 7) : null);

  const rawGender =
    p.gender ||
    (p.category === 'WOMEN'
      ? 'Women'
      : p.category === 'MEN'
      ? 'Men'
      : 'Unisex');

  const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];

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
    image: images[0] || null,
    images,
    description: p.description || '',
    colors: rawColors,
    colorway,
    brand: p.brand || p.vendor?.shopName || 'Local shop',
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
    storeId: p.vendor?._id,
    storeName: p.vendor?.shopName || p.brand || 'Local shop',
    storeArea: p.vendor?.address?.area || p.vendor?.area || '',
    locality: p.vendor?.address?.area || p.vendor?.area || '',
    storeCoordinates: Array.isArray(coords)
      ? { latitude: coords[1], longitude: coords[0] }
      : null,
    distanceKm,
    deliveryMinutes,
    etaMinutes: deliveryMinutes,
  };
};

export const useStorefrontStore = create((set) => ({
  products: allowMockCatalogue ? getCuratedProducts() : [],
  loading: !allowMockCatalogue,
  error: null,
  loaded: allowMockCatalogue,
  guestExplore: false,
  setGuestExplore: (val) => set({ guestExplore: val }),

  load: async () => {
    set({ loading: true, error: null });
    try {
      const { items } = await fetchStorefront({ limit: 50 });
      const result = resolveStorefrontLoadResult({
        items: items || [],
        mapItem: toUiProduct,
      });
      if (result.products.length === 0 && allowMockCatalogue) {
        set({
          products: getCuratedProducts(),
          loading: false,
          loaded: true,
          error: null,
        });
        return;
      }
      set({
        products: result.products,
        loading: false,
        loaded: true,
        error: null,
      });
    } catch (error) {
      console.warn('[useStorefrontStore] Live fetch note:', error.message);
      if (allowMockCatalogue) {
        set({
          products: getCuratedProducts(),
          loading: false,
          loaded: true,
          error: null,
        });
        return;
      }
      const result = resolveStorefrontLoadResult({ error });
      set({
        products: [],
        loading: false,
        loaded: true,
        error: result.error,
      });
    }
  },
}));

export default useStorefrontStore;
