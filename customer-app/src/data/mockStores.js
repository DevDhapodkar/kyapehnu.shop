/**
 * Mock catalogue — five independent fashion retailers in Nagpur.
 *
 * Targeted at the 18–35 & teenage demographic:
 * Priority: Everyday streetwear, oversized tees, hoodies, baggy denims, cargos, casual shirts, and co-ords.
 * Secondary: Contemporary fusion & everyday ethnic.
 *
 * Coordinates are real Nagpur neighbourhoods (Dharampeth, Sitabuldi, Ramdaspeth,
 * Civil Lines, and Gandhibagh) for realistic distance sort and live-tracking.
 *
 * All photography uses high-resolution fashion and streetwear editorial imagery.
 */

export const CATEGORIES = {
  TEES_HOODIES: 'Tees & Hoodies',
  DENIMS_CARGOS: 'Denims & Cargos',
  CASUAL_SHIRTS: 'Casual Shirts',
  COORDS_DRESSES: 'Co-ords & Dresses',
  STREETWEAR: 'Streetwear',
  ATHLEISURE: 'Athleisure',
  ETHNIC: 'Ethnic & Festive',
};

/** Nagpur city centre — used as the default map region before GPS resolves. */
export const NAGPUR_CENTER = {
  latitude: 21.1458,
  longitude: 79.0882,
};

export const mockStores = [
  {
    id: 'str_thread_and_bone',
    name: 'Thread & Bone',
    area: 'Nagpur Central',
    addressLine: 'First Floor, 42 Main Road, Nagpur Central 440001',
    coordinates: { latitude: 21.1458, longitude: 79.0882 },
    rating: 4.9,
    ratingCount: 680,
    distanceKm: 0.8,
    etaMinutes: 20,
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80',
    tagline: 'Nagpur Central · Heavyweight Boxy Tees, Hoodies & Raw Streetwear',
    products: [
      {
        id: 'prd_heavyweight_tee',
        name: 'Heavyweight Boxy Graphic Tee',
        category: 'Tees & Hoodies',
        gender: 'Unisex',
        subCategory: 'Graphic Tees',
        price: 1299,
        mrp: 1800,
        currency: 'INR',
        colorway: 'Washed Charcoal Black',
        material: '240 GSM combed heavyweight cotton, drop shoulder cut',
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        deliveryMinutes: 20,
        image:
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
        description:
          'Oversized boxy silhouette cut from custom 240 GSM combed cotton. Ribbed dense collar, dropped shoulders, and pre-shrunk vintage wash.',
      },
      {
        id: 'prd_vintage_hoodie',
        name: 'Vintage Drop-Shoulder Fleece Hoodie',
        category: 'Tees & Hoodies',
        gender: 'Unisex',
        subCategory: 'Hoodies & Sweatshirts',
        price: 1999,
        mrp: 2799,
        currency: 'INR',
        colorway: 'Acid Wash Olive',
        material: '380 GSM brushed cotton fleece, double-layered hood',
        sizes: ['S', 'M', 'L', 'XL'],
        deliveryMinutes: 25,
        image:
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=900&q=80',
        description:
          'Ultra-cozy 380 GSM fleece hoodie featuring dropped shoulders, ribbed hem and cuffs, kangaroo pocket, and minimal tone-on-tone embroidery.',
      },
      {
        id: 'prd_relaxed_cargos',
        name: 'Multi-Pocket Relaxed Utility Cargos',
        category: 'Denims & Cargos',
        gender: 'Unisex',
        subCategory: 'Cargo Pants',
        price: 1899,
        mrp: 2599,
        currency: 'INR',
        colorway: 'Military Khaki',
        material: 'Heavy cotton twill with reinforced knee darts',
        sizes: ['28', '30', '32', '34', '36'],
        deliveryMinutes: 22,
        image:
          'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=900&q=80',
        description:
          '6-pocket relaxed utility cargos with adjustable ankle bungee drawstrings. Perfect for campus everyday wear and skate sessions.',
      },
    ],
  },
  {
    id: 'str_urban_drift',
    name: 'Urban Drift Co.',
    area: 'West High Court Road, Nagpur',
    addressLine: '18, West High Court Road, Nagpur 440010',
    coordinates: { latitude: 21.135, longitude: 79.068 },
    rating: 4.85,
    ratingCount: 520,
    distanceKm: 1.2,
    etaMinutes: 18,
    image:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
    tagline: 'Nagpur Central · Everyday Baggy Denims & Skater Fits',
    products: [
      {
        id: 'prd_baggy_jeans',
        name: 'Vintage Baggy Skater Jeans',
        category: 'Denims & Cargos',
        gender: 'Unisex',
        subCategory: 'Baggy Jeans',
        price: 2199,
        mrp: 2999,
        currency: 'INR',
        colorway: 'Stonewashed Indigo',
        material: '13.5 oz 100% rigid cotton denim',
        sizes: ['28', '30', '32', '34', '36'],
        deliveryMinutes: 18,
        image:
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80',
        description:
          'Authentic 90s baggy fit jeans with wide straight legs, custom brass hardware, and a clean drape over chunky sneakers.',
      },
      {
        id: 'prd_flannel_overshirt',
        name: 'Relaxed Plaid Flannel Overshirt',
        category: 'Casual Shirts',
        gender: 'Men',
        subCategory: 'Flannels & Overshirts',
        price: 1699,
        mrp: 2299,
        currency: 'INR',
        colorway: 'Rust & Navy Plaid',
        material: 'Brushed heavy cotton flannel',
        sizes: ['S', 'M', 'L', 'XL'],
        deliveryMinutes: 24,
        image:
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80',
        description:
          'Soft brushed flannel overshirt designed to be worn open over a white tee or buttoned up for casual evenings.',
      },
      {
        id: 'prd_knit_polo',
        name: 'Knitted Retro Collar Polo',
        category: 'Casual Shirts',
        gender: 'Men',
        subCategory: 'Polos & Knitwear',
        price: 1499,
        mrp: 1999,
        currency: 'INR',
        colorway: 'Chalk White & Pine Green',
        material: 'Breathable 100% combed cotton fine knit',
        sizes: ['S', 'M', 'L', 'XL'],
        deliveryMinutes: 20,
        image:
          'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=900&q=80',
        description:
          'Textured retro open-collar polo with ribbed cuffs. An effortless smart-casual staple for cafe dates and college hangouts.',
      },
    ],
  },
  {
    id: 'str_campus_vogue',
    name: 'Campus Vogue Studio',
    area: 'Sadar',
    addressLine: '8, Residency Road Extension, Sadar, Nagpur 440001',
    coordinates: { latitude: 21.158, longitude: 79.08 },
    rating: 4.9,
    ratingCount: 440,
    distanceKm: 2.1,
    etaMinutes: 22,
    image:
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=600&q=80',
    tagline: 'Sadar · College Essentials, Co-ords & Casual Chic',
    products: [
      {
        id: 'prd_ribbed_coord',
        name: 'Ribbed Knit Crop & Flare Co-ord',
        category: 'Co-ords & Dresses',
        gender: 'Women',
        subCategory: 'Co-ord Sets',
        price: 1799,
        mrp: 2499,
        currency: 'INR',
        colorway: 'Mocha Brown',
        material: 'Stretch modal rib knit',
        sizes: ['XS', 'S', 'M', 'L'],
        deliveryMinutes: 22,
        image:
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
        description:
          'Matching ribbed long-sleeve crop top and high-waist flared pants. Flattering, stretchy, and ultra-comfortable for all-day campus wear.',
      },
      {
        id: 'prd_resort_linen_shirt',
        name: 'Breezy Resort Collar Linen Shirt',
        category: 'Casual Shirts',
        gender: 'Unisex',
        subCategory: 'Casual Shirts',
        price: 1599,
        mrp: 2199,
        currency: 'INR',
        colorway: 'Sage Green',
        material: '100% pure breathable linen',
        sizes: ['S', 'M', 'L', 'XL'],
        deliveryMinutes: 22,
        image:
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80',
        description:
          'Relaxed camp-collar short sleeve shirt crafted from airy pure linen. Lightweight and breezy for everyday Nagpur weather.',
      },
      {
        id: 'prd_parachute_pants',
        name: 'Techwear Parachute Cargo Pants',
        category: 'Streetwear',
        gender: 'Unisex',
        subCategory: 'Streetwear Pants',
        price: 1899,
        mrp: 2499,
        currency: 'INR',
        colorway: 'Matte Obsidian Black',
        material: 'Crisp water-repellent nylon ripstop',
        sizes: ['S', 'M', 'L', 'XL'],
        deliveryMinutes: 25,
        image:
          'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80',
        description:
          'Oversized parachute track pants with bungee cinches at waist and ankles, pleated knee articulation, and side cargo pockets.',
      },
    ],
  },
  {
    id: 'str_studio_anamika',
    name: 'Studio Anamika',
    area: 'West High Court Road, Nagpur',
    addressLine: 'Shop 14, West High Court Road, Nagpur 440010',
    coordinates: { latitude: 21.135, longitude: 79.068 },
    rating: 4.8,
    ratingCount: 390,
    distanceKm: 1.4,
    etaMinutes: 20,
    image:
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=600&q=80',
    tagline: 'Nagpur Central · Everyday Casuals & Contemporary Fusion',
    products: [
      {
        id: 'prd_acid_wash_tee',
        name: 'Distressed Acid-Wash Graphic Tee',
        category: 'Tees & Hoodies',
        gender: 'Unisex',
        subCategory: 'Graphic Tees',
        price: 1199,
        mrp: 1699,
        currency: 'INR',
        colorway: 'Washed Rust & Charcoal',
        material: '220 GSM single-jersey cotton',
        sizes: ['S', 'M', 'L', 'XL'],
        deliveryMinutes: 20,
        image:
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80',
        description:
          'Hand-treated acid-wash tee featuring vintage distressed typography graphic, dropped shoulders, and raw-edge sleeve cuffs.',
      },
      {
        id: 'prd_denim_trucker',
        name: 'Boxy Trucker Denim Jacket',
        category: 'Streetwear',
        gender: 'Unisex',
        subCategory: 'Jackets & Outerwear',
        price: 2499,
        mrp: 3499,
        currency: 'INR',
        colorway: 'Vintage Mid-Blue',
        material: '14 oz heavyweight washed cotton denim',
        sizes: ['S', 'M', 'L', 'XL'],
        deliveryMinutes: 25,
        image:
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=900&q=80',
        description:
          'Timeless boxy denim jacket with shank buttons, chest flap pockets, and subtle distressed collar detailing.',
      },
      {
        id: 'prd_everyday_kurta',
        name: 'Minimalist Everyday Cotton Straight Kurta',
        category: 'Ethnic & Festive',
        gender: 'Men',
        subCategory: 'Kurtas & Sets',
        price: 1299,
        mrp: 1799,
        currency: 'INR',
        colorway: 'Soft Natural Ivory',
        material: '100% breathable slub cotton, wooden buttons',
        sizes: ['38', '40', '42', '44'],
        deliveryMinutes: 25,
        image:
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80',
        description:
          'Contemporary straight-cut casual kurta with mandarin collar and roll-up sleeves. Designed for college pujas and casual festive days.',
      },
    ],
  },
  {
    id: 'str_sadar_trend',
    name: 'Sadar Trend Studio',
    area: 'Sadar',
    addressLine: '12, Mount Road Extension, Sadar, Nagpur 440001',
    coordinates: { latitude: 21.161, longitude: 79.082 },
    rating: 5.0,
    ratingCount: 320,
    distanceKm: 2.4,
    etaMinutes: 28,
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80',
    tagline: 'Sadar · Athleisure, Caps & Streetwear Essentials',
    products: [
      {
        id: 'prd_fleece_sweatpants',
        name: 'Wide-Leg Fleece Sweatpants',
        category: 'Athleisure',
        gender: 'Unisex',
        subCategory: 'Sweatpants & Joggers',
        price: 1699,
        mrp: 2299,
        currency: 'INR',
        colorway: 'Heather Ash Grey',
        material: '360 GSM cotton-poly brushed fleece',
        sizes: ['S', 'M', 'L', 'XL'],
        deliveryMinutes: 28,
        image:
          'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=900&q=80',
        description:
          'Relaxed wide-leg sweatpants with elasticated drawstring waistband, deep side pockets, and an open hem drape.',
      },
      {
        id: 'prd_flight_bomber',
        name: 'Lightweight Flight Bomber Jacket',
        category: 'Streetwear',
        gender: 'Unisex',
        subCategory: 'Jackets & Outerwear',
        price: 2799,
        mrp: 3899,
        currency: 'INR',
        colorway: 'Matte Obsidian Black',
        material: 'Satin nylon shell with ribbed varsity trims',
        sizes: ['S', 'M', 'L', 'XL'],
        deliveryMinutes: 30,
        image:
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80',
        description:
          'Classic MA-1 flight bomber with utility sleeve zipper pocket, contrast orange lining, and chunky metal hardware.',
      },
      {
        id: 'prd_casual_sundress',
        name: 'Tiered Cotton Casual Sundress',
        category: 'Co-ords & Dresses',
        gender: 'Women',
        subCategory: 'Casual Dresses',
        price: 1899,
        mrp: 2599,
        currency: 'INR',
        colorway: 'Butter Yellow',
        material: '100% cotton poplin with side pockets',
        sizes: ['XS', 'S', 'M', 'L'],
        deliveryMinutes: 28,
        image:
          'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=80',
        description:
          'Breezy tiered sundress with square neckline and practical hidden side pockets. The ultimate effortless weekend piece.',
      },
    ],
  },
];

/**
 * Flattened product feed with the parent store denormalised onto each item.
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

export { formatCurrency as formatINR } from '../utils/format';

export default mockStores;
