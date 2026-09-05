/**
 * Mock catalogue — five independent fashion retailers in Nagpur.
 *
 * This stands in for the `/vendors` + `/products` endpoints described in
 * ARCHITECTURE.md until the Express + MongoDB backend is wired up. Shapes here
 * intentionally mirror the planned Vendor and Product schemas so swapping the
 * import for a fetch later is a one-line change.
 *
 * Coordinates are real Nagpur neighbourhoods (Dharampeth, Sitabuldi, Ramdaspeth,
 * Civil Lines, and the Wathoda belt near Symbiosis Institute of Technology) so
 * the distance sort and the live-tracking map both look plausible in demos.
 *
 * Image URLs point at a deterministic placeholder service: the same seed always
 * returns the same photo, so the UI stays stable between reloads.
 */

const img = (seed) => `https://picsum.photos/seed/kyapehnu-${seed}/900/1200`;

export const CATEGORIES = {
  APPAREL: 'Premium Apparel',
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
    addressLine: 'Shop 14, WHC Road, Dharampeth, Nagpur 440010',
    coordinates: { latitude: 21.135, longitude: 79.068 },
    rating: 4.9,
    ratingCount: 520,
    distanceKm: 1.4,
    etaMinutes: 28,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBe8eWajVei1XnSWz0Pd5vU5uud5RV0gA_2mLkMnknAWvR7Lq5vaaMNzW-SnbpeyzvKLqGc9ZEl6HonR0iX3rUNI44tl1pjhlteTo1P1Sm0Wos-i_gyQvYqyb2guPn24rlwltIgm5DLbWlNlyX6Nisa5hgyFUVLYN6-kWeAgW-TgSs5Ar0L5wmkBhqdTUEDF5w0Mh2iqRuYd9wA9UD7kKztRdzkgFHVh0ALAq7d1dd2Tl9hC4jzzqW2QQ',
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
        material: 'Ivory and pale gold Chanderi silk, hand-embroidered zardozi lapels',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        deliveryMinutes: 28,
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCkP7tM03tqstR3uR6pEahftSH6mrdsy-Ol5dHtRCAMI8zJ5M6fEcfX_8tAktPhf_s-kS2J_0F7yPtqz2kJLdbe7mCbRUUUDYrDLdptypjhCJm1LmNbXVHwADGOXMDgzOkHICfMvszMvPIW8N8W93K8ZKx1NLYGdMCuLrvgekjRcAMZV-u8cJXlmhvyVm4p_tUmtb7xpp_ed6Km7LBwFr_WHDFHC0BfIf-ETLdQe7_3fKu3ld3Stp5q2Q',
        description:
          'Editorial fashion photography of a regal woman wearing an ivory and pale gold Chanderi silk angrakha with delicate hand-embroidered zardozi lapels. Soft warm natural sunlight streaming through wooden jali screens, warm alabaster architecture in background, quiet Indian luxury mood.',
      },
    ],
  },
  {
    id: 'str_maheshwari_handlooms',
    name: 'Maheshwari Handlooms',
    area: 'Gandhibagh',
    addressLine: 'Cloth Market, Gandhibagh, Nagpur 440002',
    coordinates: { latitude: 21.152, longitude: 79.108 },
    rating: 4.8,
    ratingCount: 380,
    distanceKm: 2.1,
    etaMinutes: 32,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB6-FQR-8cuwJinxs6ur4OsdhqAz9UJhmjX8Hnegq0mHVfrhrX1H2woNzSsDSmluh0HcGBPSWwq40Duif5rKd8f0SU1oI2l0xNAJIoAOF9SuckXB4AQTUqaiTnrE5IPD16iE9FvN85FBzHjrizMhbwYi4pH_6Q4UFDyqh5fjE92iRB_qbw-SDU9E6AQr4NGFTDqS6fiw6J_PoNvJCAwdhKoiLJHOmF7FtJu7wilhh8PnRAzGU9nS0l92w',
    tagline: 'Heritage textile showroom with neatly arranged handwoven fabrics & zari borders.',
    products: [
      {
        id: 'prd_tussar_kurta_set',
        name: 'Tussar Kurta Set',
        category: 'Silks',
        gender: 'Men',
        subCategory: 'Kurtas & Sets',
        price: 3450,
        mrp: 4500,
        currency: 'INR',
        colorway: 'Natural Biscuit Ecru',
        material: 'Handwoven tussar silk, subtle golden woven thread collar',
        sizes: ['38', '40', '42', '44'],
        deliveryMinutes: 32,
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAcGQxGdPs7Cmgd_Qv1NArIANFvz4aIvimjoIb8wxQgj9JT5i6-uAPyKvnFBAWweryBeA1o9egHLszaZ8eKFESy7HDXNR3iZX1JCP5Wwq4aEb88BadpWPgbTPQWjNXLR6vdNDx1kSbic3o3d4JXz0Ezvo-M1IALy5dx62aLtuGLqGCL61dS2jbfHt8DBdQBovxdLLk1IvxEU54m1o5wkaids3dKPNy3O3rgwXLU5sPQUj8fTRDf4wCTBQ',
        description:
          'Editorial studio portrait of a man wearing a refined handwoven tussar silk kurta in natural biscuit ecru, subtle golden woven thread collar, softly draped against a muted cream studio backdrop.',
      },
    ],
  },
  {
    id: 'str_boutique_9',
    name: 'Boutique 9',
    area: 'Sadar',
    addressLine: 'Mount Road Extension, Sadar, Nagpur 440001',
    coordinates: { latitude: 21.158, longitude: 79.083 },
    rating: 4.7,
    ratingCount: 290,
    distanceKm: 0.9,
    etaMinutes: 18,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBe8eWajVei1XnSWz0Pd5vU5uud5RV0gA_2mLkMnknAWvR7Lq5vaaMNzW-SnbpeyzvKLqGc9ZEl6HonR0iX3rUNI44tl1pjhlteTo1P1Sm0Wos-i_gyQvYqyb2guPn24rlwltIgm5DLbWlNlyX6Nisa5hgyFUVLYN6-kWeAgW-TgSs5Ar0L5wmkBhqdTUEDF5w0Mh2iqRuYd9wA9UD7kKztRdzkgFHVh0ALAq7d1dd2Tl9hC4jzzqW2QQ',
    tagline: 'Modern minimal linen and contemporary separates.',
    products: [
      {
        id: 'prd_linen_coord',
        name: 'Linen Co-ord',
        category: 'Linen',
        gender: 'Women',
        subCategory: 'Tops & Co-ords',
        price: 2890,
        mrp: 3800,
        currency: 'INR',
        colorway: 'Warm Ecru',
        material: '100% European linen, relaxed wide-leg trousers, tailored sleeveless tunic',
        sizes: ['XS', 'S', 'M', 'L'],
        deliveryMinutes: 18,
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDm01-M8MTLGkDra7e3Ipu3AICNO2PkgK5tpshdyg8NMu_KI1Qh77Ps93HrtcsEvTFwt20h9Ms_zGgqqjJzARHHePqVOnonXeli5eRTgoBYYBNe-GP1pPngW-fJ8cxx208OOjXIH_BYsXv5KpGMAdV8n_3OUItLQXYAve0JQ8DbnnQUoqY9yB8540uPTasq6PFOEzf3ve3xYNKVHzlsztDMr0oTs1TqDYMgrBx7bdFYYsJ-FY0CiQgVeA',
        description:
          'Editorial lookbook photograph of a modern minimal linen co-ord set in warm ecru tone, relaxed wide-leg trousers and tailored notch-lapel sleeveless tunic, quiet luxury aesthetic, softly diffused lighting.',
      },
    ],
  },
  {
    id: 'str_kala_niketan',
    name: 'Kala Niketan',
    area: 'Sitabuldi',
    addressLine: 'Main Road, Sitabuldi, Nagpur 440012',
    coordinates: { latitude: 21.146, longitude: 79.088 },
    rating: 4.8,
    ratingCount: 640,
    distanceKm: 0.6,
    etaMinutes: 15,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuByTVCA994DqwMs1gY0S7CBBrkhBAN816xuIaS9Li4qFjjOyC4d_0q8oYlk5oOqa_Dfe7TbjpuMdFwI7aZhTOoibf1sat34s9W1qEY5S-VvYsJpP6vyP9xjIcd4UTWlVs26nTWDOFpJAG-u-Y7yvFmi0TQikkZhSaHy32y80Fc51Fdf0Jvwi_7kweFMwGoudr5bAuKUSFi-ugsXw93eA4uHIopkSDuKD_qlECXwzpu216BF2ay9njqD1Q',
    tagline: 'Modern Indian designer studio with silk bandhgalas, waistcoats, and shirts.',
    products: [
      {
        id: 'prd_nehru_waistcoat',
        name: 'Nehru Waistcoat',
        category: 'Silks',
        gender: 'Men',
        subCategory: 'Shirts & Waistcoats',
        price: 3200,
        mrp: 4200,
        currency: 'INR',
        colorway: 'Deep Crimson Maroon',
        material: 'Structured raw silk, brass handmade buttons',
        sizes: ['38', '40', '42', '44'],
        deliveryMinutes: 15,
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBwDyiYxWy1SEA1iG8Fzf7ovxNM1GDIvJHCMPKVf6XUGdDa5vi3b48VbXxZkdCFM6voHo6MOKakLmIlKJkoz2137AoDybBT0z0YjR0Jhsy9rpViJHulDaMkjsNtfs4SB5SodSDpXfqyRlPfDQ7mRpzNHqvqxiNFY4CuCP4Pz_0vPq3ZnJeKEi9S7Ri-t-lo-95vWS_7V_jueW6lgY-3_MREw7z-IY259mK2Pdr-sEVBE5A1sYHAPQ-BCg',
        description:
          'Editorial menswear shot of a structured textured raw silk Nehru waistcoat in deep crimson maroon with brass handmade buttons, styled over a crisp ivory shirt, shot against textured stucco surface.',
      },
    ],
  },
  {
    id: 'str_ramdaspeth_horology',
    name: 'Ramdaspeth Horology Co.',
    area: 'Ramdaspeth',
    addressLine: 'Ground Floor, Palm Road, Ramdaspeth, Nagpur 440010',
    coordinates: { latitude: 21.131, longitude: 79.074 },
    rating: 4.9,
    ratingCount: 531,
    distanceKm: 1.9,
    etaMinutes: 41,
    tagline: 'Mechanical watches only. No quartz on the shelf.',
    products: [
      {
        id: 'prd_diver_automatic',
        name: 'Skin-Diver Automatic 200M',
        category: CATEGORIES.WATCHES,
        price: 28500,
        mrp: 34000,
        currency: 'INR',
        colorway: 'Matte Black / Steel',
        material: '316L steel case, sapphire crystal, 24-jewel automatic movement',
        sizes: ['38mm', '41mm'],
        image: img('diver-automatic'),
        description:
          'Screw-down crown, 120-click unidirectional bezel, and a 41-hour power reserve. Regulated in-store before it leaves the counter.',
      },
      {
        id: 'prd_field_automatic',
        name: 'Field Automatic — Sandblast Dial',
        category: CATEGORIES.WATCHES,
        price: 21900,
        mrp: 25500,
        currency: 'INR',
        colorway: 'Slate Sandblast',
        material: 'Steel case, domed hardlex, 21-jewel automatic movement',
        sizes: ['36mm', '39mm'],
        image: img('field-automatic'),
        description:
          'Hand-wound and hackable. A sandblasted dial that kills glare and a strap you can soak without thinking.',
      },
      {
        id: 'prd_dress_automatic',
        name: 'Ivory Dial Dress Automatic',
        category: CATEGORIES.WATCHES,
        price: 33200,
        mrp: 39900,
        currency: 'INR',
        colorway: 'Ivory / Rose Steel',
        material: 'Steel case, exhibition caseback, 24-jewel automatic movement',
        sizes: ['37mm', '40mm'],
        image: img('dress-automatic'),
        description:
          'Seven millimetres thin with an open caseback, so the rotor stays visible under a cuff that never quite covers it.',
      },
    ],
  },
  {
    id: 'str_civillines_house',
    name: 'House of Civil Lines',
    area: 'Civil Lines',
    addressLine: 'Bungalow 6, Civil Lines, Nagpur 440001',
    coordinates: { latitude: 21.155, longitude: 79.07 },
    rating: 4.7,
    ratingCount: 198,
    distanceKm: 3.2,
    etaMinutes: 49,
    tagline: 'Occasion wear from a single-room studio.',
    products: [
      {
        id: 'prd_crimson_slip',
        name: 'Crimson Bias-Cut Slip Dress',
        category: CATEGORIES.APPAREL,
        price: 8900,
        mrp: 11500,
        currency: 'INR',
        colorway: 'Deep Crimson',
        material: 'Silk crepe, French seams',
        sizes: ['XS', 'S', 'M', 'L'],
        image: img('crimson-slip'),
        description:
          'Cut on the bias so it moves before you do. One colour, one length, no variations — the studio only makes it in crimson.',
      },
      {
        id: 'prd_midnight_blazer',
        name: 'Midnight Unstructured Blazer',
        category: CATEGORIES.APPAREL,
        price: 12400,
        mrp: 15800,
        currency: 'INR',
        colorway: 'Midnight',
        material: 'Wool-linen, half-canvas front',
        sizes: ['S', 'M', 'L', 'XL'],
        image: img('midnight-blazer'),
        description:
          'Soft shoulder, working cuffs, and a half-canvas front that breaks in around your posture rather than against it.',
      },
    ],
  },
  {
    id: 'str_wathoda_campus',
    name: 'Campus Edit — Wathoda',
    area: 'Wathoda (near Symbiosis Institute of Technology)',
    addressLine: 'Plot 3, Wathoda Ring Road, Nagpur 440035',
    coordinates: { latitude: 21.0972, longitude: 79.147 },
    rating: 4.5,
    ratingCount: 156,
    distanceKm: 0.8,
    etaMinutes: 26,
    tagline: 'Fastest delivery on campus. Stocked for late starts.',
    products: [
      {
        id: 'prd_heavyweight_tee',
        name: 'Heavyweight Boxy Tee',
        category: CATEGORIES.APPAREL,
        price: 1450,
        mrp: 1900,
        currency: 'INR',
        colorway: 'Washed Black',
        material: '240 GSM combed cotton',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        image: img('heavyweight-tee'),
        description:
          'Boxy through the body, ribbed at the collar, and heavy enough to hold its shape after the fourth wash.',
      },
      {
        id: 'prd_steel_link_cuff',
        name: 'Steel Link Arm Cuff',
        category: CATEGORIES.CUFFS,
        price: 1980,
        mrp: 2500,
        currency: 'INR',
        colorway: 'Polished Steel',
        material: 'Stainless steel, fold-over clasp',
        sizes: ['Adjustable'],
        image: img('steel-cuff'),
        description:
          'Flat links, no charms, single clasp. Reads as jewellery from a distance and as hardware up close.',
      },
      {
        id: 'prd_campus_automatic',
        name: 'Campus Automatic 38',
        category: CATEGORIES.WATCHES,
        price: 16400,
        mrp: 19900,
        currency: 'INR',
        colorway: 'Graphite / Steel',
        material: 'Steel case, mineral crystal, 21-jewel automatic movement',
        sizes: ['38mm'],
        image: img('campus-automatic'),
        description:
          'The cheapest way into a real mechanical movement in this city. Wear it for a week and it never needs the crown.',
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
    storeCoordinates: store.coordinates,
    distanceKm: store.distanceKm,
    etaMinutes: store.etaMinutes,
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
