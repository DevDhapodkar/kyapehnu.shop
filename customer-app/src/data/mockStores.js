/**
 * Mock catalogue — five independent fashion retailers in Nagpur.
 *
 * This stands in for the `/vendors` + `/products` endpoints described in
 * ARCHITECTURE.md until the Express + MongoDB backend is wired up. Shapes here
 * intentionally mirror the planned Vendor and Product schemas so swapping the
 * import for a fetch later is a one-line change.
 *
 * Coordinates are real Nagpur neighbourhoods (Dharampeth, Sitabuldi, Ramdaspeth,
 * Civil Lines, and Gandhibagh) so the distance sort and the live-tracking map both
 * look plausible in demos.
 *
 * All photography uses verified high-resolution fashion editorial imagery.
 */

export const CATEGORIES = {
  SILKS: 'Silks',
  LINEN: 'Linen',
  FESTIVE: 'Festive',
  WOMEN: 'Women',
  MEN: 'Men',
  TOPS: 'Tops',
  SHIRTS: 'Shirts',
  DRAPES: 'Drapes',
};

/** Nagpur city centre — used as the default map region before GPS resolves. */
export const NAGPUR_CENTER = {
  latitude: 21.1458,
  longitude: 79.0882,
};

export const mockStores = [
  {
    id: 'str_studio_anamika',
    name: 'Studio Anamika',
    area: 'Dharampeth',
    addressLine: 'Shop 14, West High Court Road, Dharampeth, Nagpur 440010',
    coordinates: { latitude: 21.135, longitude: 79.068 },
    rating: 4.9,
    ratingCount: 520,
    distanceKm: 1.4,
    etaMinutes: 28,
    image:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
    tagline: 'High-end Indian boutique with curated handloom sarees & designer silhouettes.',
    products: [
      {
        id: 'prd_chanderi_angrakha',
        name: 'Chanderi Silk Angrakha',
        category: 'Silks',
        gender: 'Women',
        subCategory: 'Drapes & Angrakhas',
        price: 4800,
        mrp: 6499,
        currency: 'INR',
        colorway: 'Ivory & Pale Gold',
        material: 'Handwoven Chanderi cotton-silk, delicate zardozi lapels',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        deliveryMinutes: 28,
        image:
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',
        description:
          'Pure handwoven Chanderi cotton-silk silhouette with delicate dabka and zardozi threadwork along the asymmetrical neckline.',
      },
      {
        id: 'prd_tissue_silk_saree',
        name: 'Tissue Silk Draped Saree',
        category: 'Silks',
        gender: 'Women',
        subCategory: 'Drapes & Sarees',
        price: 6200,
        mrp: 8500,
        currency: 'INR',
        colorway: 'Heritage Gold',
        material: 'Tissue zari silk with woven jacquard border',
        sizes: ['FREE'],
        deliveryMinutes: 28,
        image:
          'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=80',
        description:
          'Handcrafted tissue silk saree woven with real metallic zari threads and delicate temple borders.',
      },
    ],
  },
  {
    id: 'str_maheshwari_handlooms',
    name: 'Maheshwari Handlooms',
    area: 'Gandhibagh',
    addressLine: '88, Cloth Market, Gandhibagh, Nagpur 440002',
    coordinates: { latitude: 21.152, longitude: 79.108 },
    rating: 4.8,
    ratingCount: 380,
    distanceKm: 2.1,
    etaMinutes: 32,
    image:
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=600&q=80',
    tagline: 'Heritage textile showroom with handwoven silks & artisanal menswear.',
    products: [
      {
        id: 'prd_tussar_kurta_set',
        name: 'Tussar Silk Kurta Set',
        category: 'Silks',
        gender: 'Men',
        subCategory: 'Kurtas & Sets',
        price: 3450,
        mrp: 4500,
        currency: 'INR',
        colorway: 'Natural Biscuit Ecru',
        material: 'Raw handwoven tussar silk, subtle golden woven thread collar',
        sizes: ['38', '40', '42', '44'],
        deliveryMinutes: 32,
        image:
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80',
        description:
          'Raw tussar silk classic straight-cut tunic with subtle golden woven thread along the mandarin bandhgala collar.',
      },
      {
        id: 'prd_nehru_waistcoat',
        name: 'Structured Nehru Waistcoat',
        category: 'Festive',
        gender: 'Men',
        subCategory: 'Shirts & Waistcoats',
        price: 3200,
        mrp: 4200,
        currency: 'INR',
        colorway: 'Deep Royal Crimson',
        material: 'Structured raw silk, handcrafted brass buttons',
        sizes: ['38', '40', '42', '44'],
        deliveryMinutes: 32,
        image:
          'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80',
        description:
          'Structured textured raw silk Nehru waistcoat in deep royal crimson, tailored with antique brass buttons.',
      },
    ],
  },
  {
    id: 'str_civillines_linen',
    name: 'Civil Lines Linen Studio',
    area: 'Civil Lines',
    addressLine: 'Bungalow 6, Palm Road, Civil Lines, Nagpur 440001',
    coordinates: { latitude: 21.155, longitude: 79.07 },
    rating: 4.8,
    ratingCount: 295,
    distanceKm: 1.8,
    etaMinutes: 24,
    image:
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=600&q=80',
    tagline: 'Minimal pure European linen silhouettes tailored for Vidarbha climate.',
    products: [
      {
        id: 'prd_linen_coord',
        name: 'Sculpted Linen Co-ord Set',
        category: 'Linen',
        gender: 'Women',
        subCategory: 'Tops & Co-ords',
        price: 2890,
        mrp: 3800,
        currency: 'INR',
        colorway: 'Warm Sand Ecru',
        material: '100% Belgian breathable linen, tailored vest & relaxed trousers',
        sizes: ['XS', 'S', 'M', 'L'],
        deliveryMinutes: 24,
        image:
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
        description:
          'Tailored notched-lapel vest paired with pleated wide-leg linen trousers. Lightweight and breathable for Vidarbha weather.',
      },
      {
        id: 'prd_crimson_slip',
        name: 'Crimson Bias-Cut Slip Dress',
        category: 'Festive',
        gender: 'Women',
        subCategory: 'Dresses & Gowns',
        price: 8900,
        mrp: 11500,
        currency: 'INR',
        colorway: 'Deep Crimson',
        material: 'Pure silk crepe with French seams',
        sizes: ['XS', 'S', 'M', 'L'],
        deliveryMinutes: 24,
        image:
          'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80',
        description:
          'Cut on the bias so it moves effortlessly before you do. Handcrafted in a limited boutique batch.',
      },
    ],
  },
  {
    id: 'str_kala_niketan',
    name: 'Kala Niketan',
    area: 'Sitabuldi',
    addressLine: '52, Main Road, Sitabuldi, Nagpur 440012',
    coordinates: { latitude: 21.146, longitude: 79.088 },
    rating: 4.95,
    ratingCount: 640,
    distanceKm: 0.6,
    etaMinutes: 15,
    image:
      'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=600&q=80',
    tagline: "Nagpur's premier bridal couture house and royal zardozi embroideries.",
    products: [
      {
        id: 'prd_zardozi_anarkali',
        name: 'Zardozi Embroidered Anarkali',
        category: 'Festive',
        gender: 'Women',
        subCategory: 'Festive Anarkali',
        price: 8900,
        mrp: 11500,
        currency: 'INR',
        colorway: 'Mulberry Red & Gold',
        material: 'Rich mulberry silk, accompanied by zari organza dupatta',
        sizes: ['S', 'M', 'L'],
        deliveryMinutes: 15,
        image:
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80',
        description:
          'Grand festive floor-length anarkali in rich mulberry silk, accompanied by a zari organza dupatta.',
      },
      {
        id: 'prd_obsidian_shirt',
        name: 'Obsidian Evening Shirt',
        category: 'Shirts',
        gender: 'Men',
        subCategory: 'Shirts & Eveningwear',
        price: 4200,
        mrp: 5600,
        currency: 'INR',
        colorway: 'Obsidian Black',
        material: '2-ply Giza cotton, mother-of-pearl buttons',
        sizes: ['S', 'M', 'L', 'XL'],
        deliveryMinutes: 15,
        image:
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80',
        description:
          'Cut long in the body and narrow through the sleeve, finished with a hand-rolled placket. Made two streets away in Sitabuldi.',
      },
    ],
  },
  {
    id: 'str_thread_and_bone',
    name: 'Thread & Bone',
    area: 'Sitabuldi',
    addressLine: 'First Floor, Main Road, Sitabuldi, Nagpur 440012',
    coordinates: { latitude: 21.1458, longitude: 79.0882 },
    rating: 4.6,
    ratingCount: 289,
    distanceKm: 2.7,
    etaMinutes: 42,
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80',
    tagline: 'Raw streetwear, boxy tees & campus essentials.',
    products: [
      {
        id: 'prd_heavyweight_tee',
        name: 'Heavyweight Boxy Tee',
        category: 'Tops',
        gender: 'Unisex',
        subCategory: 'Tops & Tees',
        price: 1450,
        mrp: 1900,
        currency: 'INR',
        colorway: 'Washed Charcoal Black',
        material: '240 GSM combed heavyweight cotton',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        deliveryMinutes: 42,
        image:
          'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
        description:
          'Boxy through the body, ribbed collar, heavy enough to hold silhouette after repeated washes.',
      },
    ],
  },
];

/**
 * Flattened product feed with the parent store denormalised onto each item.
 *
 * The Home feed, PDP, and cart all deal in single products rather than stores,
 * so they read from here instead of walking the nested structure themselves.
 */
export const allProducts = mockStores.flatMap((store) =>
  store.products.map((product) => ({
    ...product,
    storeId: store.id,
    storeName: store.name,
    storeArea: store.area,
    locality: store.area,
    storeCoordinates: store.coordinates,
    distanceKm: store.distanceKm,
    etaMinutes: product.deliveryMinutes || store.etaMinutes,
    deliveryMinutes: product.deliveryMinutes || store.etaMinutes,
    brand: store.name,
  })),
);

/** Nearest-first, which is the only sort the hyper-local model really needs. */
export const productsByProximity = [...allProducts].sort(
  (a, b) => a.distanceKm - b.distanceKm,
);

export function getStoreById(storeId) {
  return mockStores.find((store) => store.id === storeId) ?? null;
}

export function getProductById(productId) {
  return allProducts.find((product) => product.id === productId) ?? null;
}

/**
 * Kept as a named export because every customer screen already imports it from
 * here, but the implementation now lives in `utils/format` so the vendor flow
 * and the customer flow render rupees identically.
 */
export { formatCurrency as formatINR } from '../utils/format';

export default mockStores;
